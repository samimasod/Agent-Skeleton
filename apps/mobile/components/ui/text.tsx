import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';

const textVariants = cva('text-foreground text-base', {
  variants: {
    variant: {
      // Standard HTML-ish variants
      default: 'text-base',
      h1: 'text-4xl font-extrabold tracking-tight',
      h2: 'text-3xl font-semibold tracking-tight',
      h3: 'text-2xl font-semibold tracking-tight',
      h4: 'text-xl font-semibold tracking-tight',
      p: 'leading-7',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium',
      // iOS-style typography variants used in screens
      largeTitle: 'text-4xl font-bold tracking-tight',
      title1: 'text-3xl font-bold',
      title2: 'text-2xl font-bold',
      title3: 'text-xl font-semibold',
      heading: 'text-base font-semibold',
      body: 'text-base',
      callout: 'text-base',
      subhead: 'text-sm',
      footnote: 'text-xs',
      caption1: 'text-xs',
      caption2: 'text-[10px]',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
    color: 'default',
  },
});

type TextVariantProps = VariantProps<typeof textVariants>;

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant,
  color,
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return (
    <Component
      className={cn(textVariants({ variant, color }), textClass, className)}
      {...props}
    />
  );
}

export { Text, TextClassContext };
