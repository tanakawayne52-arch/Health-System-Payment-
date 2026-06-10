# FEPMS Test Credentials

## 🔐 Default Test Accounts

All passwords are case-sensitive. The system uses plaintext password comparison during authentication.

### National Admin (All Permissions)
```
Email:    admin@mohcc.gov.zw
Password: admin123
Name:     Sarah Ncube
Role:     national_admin
Access:   All dashboards, user management, system admin functions
```

### Provincial Officers (10 Accounts)
All provincial officers use password: `password123`

| Email | Name | Province |
|-------|------|----------|
| harare@mohcc.gov.zw | Tendai Moyo | HARARE |
| bulawayo@mohcc.gov.zw | Grace Sibanda | BULAWAYO |
| manicaland@mohcc.gov.zw | Joseph Mutema | MANICALAND |
| mashonaland.central@mohcc.gov.zw | Blessing Chirume | MASHONALAND CENTRAL |
| mashonaland.east@mohcc.gov.zw | Kudzai Mufuka | MASHONALAND EAST |
| mashonaland.west@mohcc.gov.zw | Amelia Dube | MASHONALAND WEST |
| masvingo@mohcc.gov.zw | Nelson Chuma | MASVINGO |
| matabeleland.north@mohcc.gov.zw | Siphiwe Ndaba | MATABELELAND NORTH |
| matabeleland.south@mohcc.gov.zw | Mpilo Khumalo | MATABELELAND SOUTH |
| midlands@mohcc.gov.zw | Charity Mpofu | MIDLANDS |

**Permissions**: Create/view/edit beneficiaries and payment lists; view payment batches and audit logs

### HR Custodians (4 Accounts)
Password: `password123` (except hr_harare uses `hr123`)

| Email | Password | Name | Role |
|-------|----------|------|------|
| hr@mohcc.gov.zw | hr123 | Memory Mupote | HR Custodian (Harare) |
| hr.bulawayo@mohcc.gov.zw | password123 | Nomsa Ndlela | HR Custodian (Bulawayo) |
| hr.manicaland@mohcc.gov.zw | password123 | Edith Mazambani | HR Custodian (Manicaland) |
| hr.midlands@mohcc.gov.zw | password123 | Pamela Muzari | HR Custodian (Midlands) |

**Permissions**: Full CRUD on beneficiaries and payment cycles; manage VHW master list

### Finance Officers (10 Accounts)
Password: `password123` (all)

| Email | Name | Province |
|-------|------|----------|
| finance.harare@mohcc.gov.zw | Peter Ndlovu | HARARE |
| finance.bulawayo@mohcc.gov.zw | Tawanda Chirume | BULAWAYO |
| finance.manicaland@mohcc.gov.zw | Rudo Mhondiwa | MANICALAND |
| finance.mashonaland.central@mohcc.gov.zw | Tinashe Chingoka | MASHONALAND CENTRAL |
| finance.mashonaland.east@mohcc.gov.zw | Shamiso Mavhunga | MASHONALAND EAST |
| finance.mashonaland.west@mohcc.gov.zw | Washington Munetsi | MASHONALAND WEST |
| finance.masvingo@mohcc.gov.zw | Patience Gwenzi | MASVINGO |
| finance.matabeleland.north@mohcc.gov.zw | Loveness Mutemeri | MATABELELAND NORTH |
| finance.matabeleland.south@mohcc.gov.zw | Tinotenda Kanhukamwe | MATABELELAND SOUTH |
| finance.midlands@mohcc.gov.zw | Esther Masango | MIDLANDS |
| finance.national@mohcc.gov.zw | Dr. David Mwale | National Level |

**Permissions**: Create/manage payment batches and transactions; reconciliation; view reports; audit logs

---

## 📱 System Access

### Frontend
- **URL**: http://127.0.0.1:3001
- **Browser**: Chrome, Firefox, Safari, Edge (any modern browser)

### Backend API
- **Base URL**: http://127.0.0.1:3000/api
- **Authentication**: JWT Bearer tokens
- **Port**: 3000

### Database
- **Type**: MySQL 8.0
- **Host**: 127.0.0.1
- **Port**: 3306
- **Database**: fepms_db
- **User**: root (default, no password)

---

## 🔑 Quick Login Testing

### Option 1: Using Frontend UI
1. Navigate to http://127.0.0.1:3001
2. Enter credentials from above
3. Click "Sign in"

### Option 2: Using API Directly
```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mohcc.gov.zw","password":"admin123"}'
```

### Option 3: Using PowerShell
```powershell
$body = @{
  email="admin@mohcc.gov.zw"
  password="admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:3000/api/auth/login `
  -Method Post -Body $body -ContentType application/json
```

---

## 🎯 Recommended Test Scenarios

### Test All Roles
```
1. National Admin    → admin@mohcc.gov.zw / admin123
2. Provincial Officer → harare@mohcc.gov.zw / password123
3. HR Custodian      → hr@mohcc.gov.zw / hr123
4. Finance Officer   → finance.harare@mohcc.gov.zw / password123
```

### Test Province-Specific Views
Each provincial officer only sees their province's data:
- Use harare@mohcc.gov.zw to test HARARE province
- Use bulawayo@mohcc.gov.zw to test BULAWAYO province
- etc.

### Test Different Dashboards
- **Admin Dashboard** → Login as admin@mohcc.gov.zw
- **Finance Dashboard** → Login as finance.harare@mohcc.gov.zw
- **Provincial Dashboard** → Login as harare@mohcc.gov.zw
- **HR Dashboard** → Login as hr@mohcc.gov.zw

---

## ⚠️ Important Notes

1. **Password Case Sensitivity**: All passwords are case-sensitive
2. **Email Format**: All emails must exactly match the database entries
3. **Token Expiry**: Access tokens expire after 24 hours
4. **Refresh Tokens**: Use refresh endpoint to get new access token
5. **Session Logout**: Users must explicitly logout to clear tokens
6. **Browser Storage**: Tokens stored in localStorage after login

---

## 🔄 Common Login Issues

### "Invalid credentials. Please try again."
- ✅ Check email spelling (must be exact)
- ✅ Check password spelling and case
- ✅ Verify backend API is running on port 3000
- ✅ Check browser console for API errors

### Frontend on Wrong Port
- ✅ Frontend should be on http://127.0.0.1:3001 (not 5173)
- ✅ Backend should be on http://127.0.0.1:3000

### No Backend Connection
- ✅ Start backend: `cd backend/php-api && php -S 127.0.0.1:3000 router.php`
- ✅ Verify MySQL is running
- ✅ Check `frontend/src/lib/api.ts` for correct API_BASE_URL

---

## 📊 Sample Data Included

The database includes:
- ✅ 24 test users (4 roles across provinces)
- ✅ 6 payment cycles (Q1 2025 - Q2 2026)
- ✅ 3 VHW beneficiary records
- ✅ 10 audit log entries
- ✅ 3 exception requests
- ✅ 7 Ecopay transactions
- ✅ Complete role permissions matrix

All data is ready for testing without additional setup.
