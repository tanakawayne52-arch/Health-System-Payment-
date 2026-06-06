# FEPMS Deployment Checklist

## Pre-Deployment Requirements

### Code Quality
- [ ] TypeScript compilation passes: `pnpm tsc --noEmit`
- [ ] No ESLint errors: `pnpm lint`
- [ ] All imports are used
- [ ] No console.error or console.warn in production code
- [ ] All hardcoded values are documented

### Testing
- [ ] Login functionality works for all roles
- [ ] Navigation between all pages functions correctly
- [ ] Forms submit without errors
- [ ] Charts and visualizations render properly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] localStorage data persists across page reloads

### Documentation
- [ ] README.md is up to date
- [ ] Component props are documented
- [ ] Type definitions are complete
- [ ] Installation instructions are clear

## Build Steps

### 1. Clean Build
```bash
rm -rf dist node_modules
pnpm install
pnpm build
```

### 2. Verify Build Output
```bash
ls -lh dist/
# Ensure dist folder contains index.html and assets
```

### 3. Build Size Check
```bash
# Check that bundle size is reasonable
du -sh dist/
```

## Deployment Platforms

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Environment Variables** (if needed):
- None required for this version (uses localStorage)

### GitHub Pages
```bash
# Build with correct base path
npm run build -- --base=/your-repo-name/

# Deploy dist folder to gh-pages branch
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Manual Deployment
1. Run `pnpm build` locally
2. Upload `dist/` folder to web server
3. Configure web server to serve `index.html` for all routes
4. Verify HTTPS is enabled

## Post-Deployment Testing

### Functional Testing
- [ ] All dashboards load without errors
- [ ] Can login with test credentials
- [ ] Can view all role-specific pages
- [ ] Charts load and display correctly
- [ ] Tables are searchable and filterable
- [ ] Forms validate input properly
- [ ] Notifications display correctly

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90 (Performance)
- [ ] No console errors or warnings
- [ ] API requests complete within acceptable time

### Browser Compatibility
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Security Checklist
- [ ] HTTPS is enforced
- [ ] Content Security Policy headers set
- [ ] X-Frame-Options header set
- [ ] No sensitive data in localStorage for production
- [ ] All external dependencies are up to date

## Monitoring

### Error Tracking
- Set up error logging (Sentry recommended)
- Configure error notifications

### Analytics
- Add Google Analytics or Plausible
- Track user engagement

### Uptime Monitoring
- Set up uptime monitoring (UptimeRobot, etc.)
- Configure alerts

## Rollback Plan

If issues occur post-deployment:

1. **Immediate**: Revert to previous deployment
2. **Investigation**: Check error logs
3. **Fix**: Apply patch and rebuild
4. **Testing**: Run full test suite
5. **Redeploy**: Deploy fixed version

## Environment-Specific Configurations

### Development
- `pnpm dev` - Runs on http://localhost:3000
- HMR enabled
- Full source maps
- No minification

### Production
- `pnpm build` - Optimized build
- Minified and tree-shaked
- Source maps excluded (or included conditionally)
- Code splitting enabled

## Maintenance

### Regular Updates
- [ ] Check for dependency updates monthly
- [ ] Review security advisories
- [ ] Test updates in staging environment

### Backup & Recovery
- [ ] Backup source code to repository
- [ ] Maintain deployment history
- [ ] Document any custom configurations

## Contact & Support

For deployment issues:
1. Check build logs for errors
2. Verify environment variables
3. Review browser console for client-side errors
4. Check network requests in DevTools

---

**Last Updated**: June 2, 2026  
**Maintenance Schedule**: Monthly  
**Review Frequency**: Quarterly
