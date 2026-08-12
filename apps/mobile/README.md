# Mobile App Notes

## Running

Start Expo from the repository root:

```bash
pnpm --filter @skeleton/mobile exec expo start --clear
```

Use Expo Go, the iOS simulator, or an Android emulator from the Expo terminal.

## Native Animations

Use React Native animation APIs for native motion. Do not use Tailwind-style transition classes such as `transition-*`, `duration-*`, or transform transitions for native components.

Preferred drawer/slide pattern:

```tsx
const x = useRef(new Animated.Value(isOpen ? 0 : -width)).current;

useEffect(() => {
  Animated.timing(x, {
    toValue: isOpen ? 0 : -width,
    duration: 220,
    useNativeDriver: true,
  }).start();
}, [isOpen, x]);

return (
  <Animated.View style={{ transform: [{ translateX: x }] }}>
    {children}
  </Animated.View>
);
```

This works on iOS and Android in Expo Go because it uses React Native's built-in `Animated` driver. Use `useNativeDriver: true` for transform and opacity animations. For layout animations such as height or width, use `useNativeDriver: false` or refactor the motion to transform/opacity.

Keep NativeWind classes for static styling: color, spacing, radius, typography, borders, and layout. Keep motion in `Animated` or a deliberately configured Reanimated component.

## Safe Areas

Authenticated app chrome is wrapped in `SafeAreaView` inside `components/layout/app-layout.tsx`. Keep top bars, drawers, and full-screen authenticated content inside that shell so iOS status icons, notches, and Android system insets do not overlap the UI.

Auth screens own their own `SafeAreaView` because they render outside `AppLayout`. New full-screen flows should either use `AppLayout` or add an explicit safe-area wrapper at the screen boundary.

## Theme Switching

Use `useTheme()` from `providers/theme-provider.tsx` for mobile light/dark controls. The provider owns the current theme, calls NativeWind's `colorScheme.set(theme)`, and applies the active token map with NativeWind's `vars()` API so `bg-background`, `text-foreground`, `bg-card`, and other token-based classes receive the correct CSS variable values.

Mobile theme variables are applied from `providers/theme-provider.tsx`. Keep screen styling token-based instead of scattering `dark:*` overrides through screens.

Lucide icons should use native `color` props from `useTheme().colors`, not `className="text-..."`. Text and View styles can use NativeWind token classes, but SVG icons do not always inherit those classes reliably on native.
