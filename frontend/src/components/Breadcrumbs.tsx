import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const breadcrumbMap: Record<string, { label: string, parent?: string }> = {
  '/': { label: 'Overview' },
  '/beneficiaries': { label: 'VHW Records', parent: '/' },
  '/payment-lists': { label: 'Payment Lists', parent: '/' },
  '/payment-lists/new': { label: 'Create Payment List', parent: '/payment-lists' },
  '/payment-batches': { label: 'Payment Batches', parent: '/' },
  '/payment-cycles': { label: 'Payment Cycles', parent: '/' },
  '/reconciliation': { label: 'Reconciliation', parent: '/' },
  '/audit-trail': { label: 'Audit Trail', parent: '/' },
  '/reports': { label: 'Reports', parent: '/' },
  '/users': { label: 'User Management', parent: '/' },
  '/vhw-national-dashboard': { label: 'National VHW Analytics', parent: '/' },
  '/vhw-provincial-dashboard': { label: 'Provincial VHW Analytics', parent: '/' },
  '/vhw-master-records': { label: 'VHW Master Records', parent: '/' },
  '/facilities': { label: 'Physical Facilities', parent: '/' },
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = [];
  let currentPath = '';

  // Build full path segments
  const segments = location.pathname.split('/').filter(Boolean);
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const crumb = breadcrumbMap[currentPath];
    if (crumb) {
      pathSegments.push({ path: currentPath, ...crumb });
    }
  }

  // Prepend the root if not already there
  if (pathSegments.length === 0 || pathSegments[0].path !== '/') {
    pathSegments.unshift({ path: '/', label: 'Overview' });
  } else {
    // Check if we need to add parent hierarchy
    const firstCrumb = pathSegments[0];
    if (firstCrumb.parent === '/') {
      pathSegments.unshift({ path: '/', label: 'Overview' });
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold overflow-x-auto whitespace-nowrap pb-2">
      {pathSegments.map((crumb, index) => {
        const isLast = index === pathSegments.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {isLast ? (
              <span className="text-slate-900 font-bold truncate">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-slate-500 hover:text-teal-600 transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
