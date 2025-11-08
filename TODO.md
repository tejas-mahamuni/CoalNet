# TODO: Implement Maximize Chart Feature with Modal

## Steps Completed

1. **Import Dialog Components**: ✅ Added imports for Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger from '@/components/ui/dialog' in DashboardPage.tsx.

2. **Add Dialog State**: ✅ Introduced new state variables `isChartMaximized`, `isMethaneChartMaximized`, and `isPieChartMaximized` to control the dialog open/close.

3. **Modify Maximize Button**: ✅ Updated the maximize buttons in the chart card headers to open the dialogs instead of toggling height.

4. **Create Full-Screen Dialog**: ✅ Wrapped the charts in Dialog components with full-screen styling, glass effect, and backdrop blur.

5. **Add Minimize Button**: ✅ Included minimize buttons in the dialog headers to close the modals.

6. **Apply Liquid Glass Effect**: ✅ Used custom CSS classes for liquid glass effect on the dialog content.

7. **Ensure Chart Responsiveness**: ✅ Set the chart containers to full height in the modals for proper display.

8. **Test Functionality**: ✅ Verified the modals open/close, backdrop blur works, and charts render correctly in full-screen.

9. **Add ESC Key Support**: ✅ Ensured the dialogs can be closed with ESC key for better UX (Dialog component supports this by default).

10. **Add Pie Chart Maximize**: ✅ Added maximize functionality to the "Emissions by Scope" pie chart with dialog modal.

## Pending Issues

- **Methane Statistics**: The percentage shows 0.0% likely due to missing or zero methane data in the API response. Need to verify backend data includes methane values in monthlyEmissions array.
