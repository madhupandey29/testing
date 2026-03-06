# Dependencies Version Report

## Commands to Check Dependencies

### 1. List All Installed Dependencies
```bash
npm list --depth=0
```

### 2. Check for Outdated Packages
```bash
npm outdated
```

### 3. View package.json
```bash
cat package.json
```

### 4. Check Specific Package
```bash
npm list <package-name>
```

### 5. Check Latest Available Version
```bash
npm view <package-name> version
```

---

## Current Dependencies Status

### Production Dependencies (26 packages)

| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| @headlessui/react | 2.2.9 | 2.2.9 | ✅ Up to date |
| @hookform/resolvers | 3.10.0 | 5.2.2 | ⚠️ Major update available |
| @popperjs/core | 2.11.8 | 2.11.8 | ✅ Up to date |
| @react-oauth/google | 0.12.2 | 0.13.4 | ⚠️ Minor update available |
| @react-pdf/renderer | 4.3.2 | 4.3.2 | ✅ Up to date |
| @reduxjs/toolkit | 1.9.7 | 2.11.2 | ⚠️ Major update available |
| bootstrap | 5.3.8 | 5.3.8 | ✅ Up to date |
| dayjs | 1.11.19 | 1.11.19 | ✅ Up to date |
| framer-motion | 12.18.1 | 12.34.3 | ⚠️ Minor update available |
| js-cookie | 3.0.5 | 3.0.5 | ✅ Up to date |
| jspdf | 4.0.0 | 4.2.0 | ⚠️ Minor update available |
| next | 14.2.35 | 16.1.6 | ⚠️ Major update available |
| next-sitemap | 4.2.3 | 4.2.3 | ✅ Up to date |
| qrcode | 1.5.4 | 1.5.4 | ✅ Up to date |
| react | 18.2.0 | 19.2.4 | ⚠️ Major update available |
| react-dom | 18.2.0 | 19.2.4 | ⚠️ Major update available |
| react-hook-form | 7.57.0 | 7.71.2 | ⚠️ Minor update available |
| react-icons | 5.5.0 | 5.5.0 | ✅ Up to date |
| react-modal | 3.16.1 | 3.16.3 | ⚠️ Patch update available |
| react-paginate | 8.2.0 | 8.3.0 | ⚠️ Minor update available |
| react-range | 1.8.14 | 1.10.0 | ⚠️ Minor update available |
| react-redux | 8.1.3 | 9.2.0 | ⚠️ Major update available |
| react-simple-chatbot | 0.5.0 | 0.6.1 | ⚠️ Minor update available |
| react-simple-star-rating | 5.1.7 | 5.1.7 | ✅ Up to date |
| react-slick | 0.29.0 | 0.31.0 | ⚠️ Minor update available |
| react-spinners | 0.13.8 | 0.17.0 | ⚠️ Minor update available |
| react-timer-hook | 3.0.7 | 4.0.5 | ⚠️ Major update available |
| react-toastify | 11.0.5 | 11.0.5 | ✅ Up to date |
| react-use | 17.4.0 | 17.6.0 | ⚠️ Minor update available |
| sass | 1.69.5 | 1.97.3 | ⚠️ Minor update available |
| slick-carousel | 1.8.1 | 1.8.1 | ✅ Up to date |
| styled-components | 4.4.1 | 6.3.11 | ⚠️ Major update available |
| swiper | 11.2.8 | 12.1.2 | ⚠️ Major update available |
| swr | 2.3.6 | 2.4.0 | ⚠️ Patch update available |
| yup | 1.6.1 | 1.7.1 | ⚠️ Minor update available |

### Development Dependencies (18 packages)

| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| @fullhuman/postcss-purgecss | 7.0.2 | 8.0.0 | ⚠️ Major update available |
| @next/bundle-analyzer | 15.5.9 | 16.1.6 | ⚠️ Major update available |
| @types/node | 24.10.4 | 25.3.0 | ⚠️ Major update available |
| @types/styled-components | 4.4.3 | 5.1.36 | ⚠️ Major update available |
| @typescript-eslint/eslint-plugin | 6.21.0 | 8.56.1 | ⚠️ Major update available |
| @typescript-eslint/parser | 6.21.0 | 8.56.1 | ⚠️ Major update available |
| autoprefixer | 10.4.23 | 10.4.24 | ⚠️ Patch update available |
| critters-webpack-plugin | 3.0.2 | 3.0.2 | ✅ Up to date |
| cross-env | 10.1.0 | 10.1.0 | ✅ Up to date |
| cssnano | 7.1.2 | 7.1.2 | ✅ Up to date |
| eslint | 8.57.1 | 10.0.2 | ⚠️ Major update available |
| eslint-config-next | 14.2.35 | 16.1.6 | ⚠️ Major update available |
| eslint-config-prettier | 10.1.8 | 10.1.8 | ✅ Up to date |
| postcss | 8.5.6 | 8.5.6 | ✅ Up to date |
| postcss-flexbugs-fixes | 5.0.2 | 5.0.2 | ✅ Up to date |
| postcss-preset-env | 10.2.4 | 11.2.0 | ⚠️ Major update available |
| prettier | 3.6.0 | 3.8.1 | ⚠️ Minor update available |
| tailwindcss | 4.1.10 | 4.2.1 | ⚠️ Minor update available |
| typescript | 5.8.3 | 5.9.3 | ⚠️ Minor update available |

---

## Summary

- **Total Dependencies**: 44 packages
- **Up to Date**: 13 packages (30%)
- **Updates Available**: 31 packages (70%)
  - Major updates: 14 packages
  - Minor updates: 14 packages
  - Patch updates: 3 packages

---

## Critical Updates to Consider

### 🔴 High Priority (Breaking Changes)

1. **React 18 → 19**
   - Major version update
   - Review breaking changes before updating
   - Update react and react-dom together

2. **Next.js 14 → 16**
   - Major version update
   - Significant new features and breaking changes
   - Test thoroughly after update

3. **@reduxjs/toolkit 1.9 → 2.11**
   - Major version update
   - Check migration guide

### 🟡 Medium Priority (Feature Updates)

1. **framer-motion** - Minor update available
2. **react-hook-form** - Minor update available
3. **sass** - Minor update available
4. **tailwindcss** - Minor update available
5. **typescript** - Minor update available

### 🟢 Low Priority (Patch Updates)

1. **autoprefixer** - Patch update
2. **react-modal** - Patch update
3. **swr** - Patch update

---

## Update Commands

### Update All Packages (Careful!)
```bash
npm update
```

### Update Specific Package
```bash
npm install <package-name>@latest
```

### Update to Specific Version
```bash
npm install <package-name>@<version>
```

### Update Dev Dependencies
```bash
npm update --save-dev
```

### Check What Would Be Updated
```bash
npm outdated
```

---

## Recommended Update Strategy

### Phase 1: Safe Updates (Patch & Minor)
```bash
npm install autoprefixer@latest
npm install react-modal@latest
npm install swr@latest
npm install prettier@latest
npm install tailwindcss@latest
npm install typescript@latest
```

### Phase 2: Test Major Updates in Development
```bash
# Create a new branch first
git checkout -b update-dependencies

# Update one major package at a time
npm install react@latest react-dom@latest
npm run build
npm run lint
# Test thoroughly

# If successful, commit and continue
npm install next@latest
npm run build
npm run lint
# Test thoroughly
```

### Phase 3: Update Remaining Packages
After testing major updates, update remaining packages.

---

## Important Notes

1. **Always backup/commit before updating**
2. **Test after each major update**
3. **Read changelogs for breaking changes**
4. **Update package-lock.json** (automatically done by npm)
5. **Run `npm audit` to check for security vulnerabilities**

---

## Security Check

Run this command to check for security vulnerabilities:
```bash
npm audit
```

Fix vulnerabilities:
```bash
npm audit fix
```

Force fix (may cause breaking changes):
```bash
npm audit fix --force
```

---

## Additional Useful Commands

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check for Duplicate Packages
```bash
npm dedupe
```

### View Package Info
```bash
npm info <package-name>
```

### View Package Versions
```bash
npm view <package-name> versions
```
