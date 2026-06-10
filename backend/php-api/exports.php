<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);

if ($parts[0] !== 'exports') {
    sendResponse(false, null, 'Route not found', 404);
}

function sendCsv(string $filename, string $content): void {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo $content;
    exit();
}

function sendPdfPlaceholder(string $filename, string $content): void {
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo $content;
    exit();
}

if (count($parts) === 4 && $parts[1] === 'batch' && in_array($parts[3], ['excel', 'pdf'], true)) {
    $batchId = $parts[2];
    $stmt = $conn->prepare('SELECT * FROM payment_batches WHERE id = ? LIMIT 1');
    $stmt->execute([$batchId]);
    $batch = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$batch) {
        sendResponse(false, null, 'Batch not found', 404);
    }

    if ($parts[3] === 'excel') {
        $content = "Batch ID,Batch Name,Province,District,Status,Total Beneficiaries,Total Amount,Created At\n";
        $content .= sprintf("%s,%s,%s,%s,%s,%d,%.2f,%s\n",
            $batch['id'], $batch['name'], $batch['province'], $batch['district'] ?? '', $batch['status'], (int)$batch['total_beneficiaries'], (float)$batch['total_amount'], $batch['created_at']
        );
        sendCsv("batch-{$batchId}.csv", $content);
    }

    require_once __DIR__ . '/fpdf.php';
    $pdf = new FPDF();
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'Payment Batch Export', 0, 1, 'C');
    $pdf->Ln(10);
    $pdf->SetFont('Arial', '', 12);
    $pdf->Cell(50, 10, 'Batch ID:', 0, 0);
    $pdf->Cell(0, 10, $batch['id'], 0, 1);
    $pdf->Cell(50, 10, 'Name:', 0, 0);
    $pdf->Cell(0, 10, $batch['name'], 0, 1);
    $pdf->Cell(50, 10, 'Province:', 0, 0);
    $pdf->Cell(0, 10, $batch['province'], 0, 1);
    $pdf->Cell(50, 10, 'Status:', 0, 0);
    $pdf->Cell(0, 10, ucfirst($batch['status']), 0, 1);
    $pdf->Cell(50, 10, 'Total Beneficiaries:', 0, 0);
    $pdf->Cell(0, 10, number_format((int)$batch['total_beneficiaries']), 0, 1);
    $pdf->Cell(50, 10, 'Total Amount:', 0, 0);
    $pdf->Cell(0, 10, '$' . number_format((float)$batch['total_amount'], 2), 0, 1);
    $pdf->Cell(50, 10, 'Created At:', 0, 0);
    $pdf->Cell(0, 10, $batch['created_at'], 0, 1);
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="batch-' . $batchId . '.pdf"');
    $pdf->Output('D', 'batch-' . $batchId . '.pdf');
    exit();
}

if (count($parts) === 3 && $parts[1] === 'beneficiaries' && $parts[2] === 'excel') {
    $query = 'SELECT id, full_name, national_id, ecocash_number, province, district, ward, village, facility, status, exit_date, exit_reason, date_joined, created_at FROM beneficiaries WHERE 1=1';
    $bindings = [];
    if (!empty($_GET['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $_GET['province'];
    }
    if (!empty($_GET['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $_GET['status'];
    }
    $query .= ' ORDER BY created_at DESC';

    $countStmt = $conn->prepare(str_replace('SELECT id, full_name, national_id, ecocash_number, province, district, ward, village, facility, status, exit_date, exit_reason, date_joined, created_at', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $totalRows = (int)$countStmt->fetchColumn();
    if ($totalRows > MAX_EXPORT_ROWS) {
        sendResponse(false, null, 'Export would exceed maximum of ' . MAX_EXPORT_ROWS . ' rows. Narrow your filters and try again.', 413);
    }

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $content = "ID,Full Name,National ID,EcoCash Number,Province,District,Ward,Village,Facility,Status,Exit Date,Exit Reason,Date Joined,Created At\n";
    foreach ($rows as $row) {
        $content .= sprintf('"%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"\n',
            $row['id'], $row['full_name'], $row['national_id'], $row['ecocash_number'], $row['province'], $row['district'], $row['ward'], $row['village'], $row['facility'], $row['status'], $row['exit_date'] ?? '', $row['exit_reason'] ?? '', $row['date_joined'], $row['created_at']
        );
    }

    sendCsv('beneficiaries.csv', $content);
}

if (count($parts) === 4 && $parts[1] === 'reconciliation' && $parts[2] === 'excel' && $parts[3] === '') {
    // Some routing systems may produce an empty segment, normalize it.
    $parts = array_values(array_filter($parts, fn($segment) => $segment !== ''));
}

if (count($parts) === 3 && $parts[1] === 'reconciliation' && $parts[2] === 'excel') {
    $query = 'SELECT t.id, t.batch_id, t.beneficiary_id, t.ecocash_number, t.amount, t.status, t.reference_code, t.failure_reason, t.processed_at, t.created_at FROM payment_transactions t WHERE 1=1';
    $bindings = [];
    if (!empty($_GET['province'])) {
        $query .= ' AND beneficiary_id IN (SELECT id FROM beneficiaries WHERE province = ?)';
        $bindings[] = $_GET['province'];
    }
    if (!empty($_GET['startDate'])) {
        $query .= ' AND date(t.created_at) >= ?';
        $bindings[] = $_GET['startDate'];
    }
    if (!empty($_GET['endDate'])) {
        $query .= ' AND date(t.created_at) <= ?';
        $bindings[] = $_GET['endDate'];
    }
    $query .= ' ORDER BY t.created_at DESC';

    $countStmt = $conn->prepare(str_replace('SELECT t.id, t.batch_id, t.beneficiary_id, t.ecocash_number, t.amount, t.status, t.reference_code, t.failure_reason, t.processed_at, t.created_at', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $totalRows = (int)$countStmt->fetchColumn();
    if ($totalRows > MAX_EXPORT_ROWS) {
        sendResponse(false, null, 'Export would exceed maximum of ' . MAX_EXPORT_ROWS . ' rows. Narrow your filters and try again.', 413);
    }

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $content = "Transaction ID,Batch ID,Beneficiary ID,EcoCash Number,Amount,Status,Reference Code,Failure Reason,Processed At,Created At\n";
    foreach ($rows as $row) {
        $content .= sprintf('"%s","%s","%s","%s","%.2f","%s","%s","%s","%s","%s"\n',
            $row['id'], $row['batch_id'], $row['beneficiary_id'], $row['ecocash_number'], (float)$row['amount'], $row['status'], $row['reference_code'] ?? '', $row['failure_reason'] ?? '', $row['processed_at'] ?? '', $row['created_at']
        );
    }

    sendCsv('reconciliation.csv', $content);
}

sendResponse(false, null, 'Route not found', 404);
