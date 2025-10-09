import 'package:flutter/material.dart';

/// A responsive widget that provides different layouts based on screen size
class ResponsiveWidget extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  final Widget? web;

  const ResponsiveWidget({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.web,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    // Determine device type based on screen size
    if (screenWidth >= 1200) {
      // Desktop or large tablet in landscape
      return web ?? desktop ?? tablet ?? mobile;
    } else if (screenWidth >= 800) {
      // Tablet or desktop in portrait
      return desktop ?? tablet ?? mobile;
    } else if (screenWidth >= 600) {
      // Large mobile or small tablet
      return tablet ?? mobile;
    } else {
      // Mobile
      return mobile;
    }
  }
}

/// A responsive layout that automatically adjusts columns based on screen size
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final int mobileColumns;
  final int? tabletColumns;
  final int? desktopColumns;
  final double spacing;
  final double runSpacing;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.mobileColumns = 2,
    this.tabletColumns,
    this.desktopColumns,
    this.spacing = 8.0,
    this.runSpacing = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    int columns;
    if (screenWidth >= 1200) {
      columns = desktopColumns ?? tabletColumns ?? mobileColumns;
    } else if (screenWidth >= 800) {
      columns = tabletColumns ?? mobileColumns;
    } else {
      columns = mobileColumns;
    }

    return Wrap(
      spacing: spacing,
      runSpacing: runSpacing,
      children: children.map((child) {
        return SizedBox(
          width: (screenWidth - spacing * (columns - 1)) / columns,
          child: child,
        );
      }).toList(),
    );
  }
}

/// A responsive container that adjusts padding based on screen size
class ResponsivePadding extends StatelessWidget {
  final Widget child;
  final double? mobilePadding;
  final double? tabletPadding;
  final double? desktopPadding;

  const ResponsivePadding({
    super.key,
    required this.child,
    this.mobilePadding,
    this.tabletPadding,
    this.desktopPadding,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    double padding;
    if (screenWidth >= 1200) {
      padding = desktopPadding ?? tabletPadding ?? mobilePadding ?? 24.0;
    } else if (screenWidth >= 800) {
      padding = tabletPadding ?? mobilePadding ?? 20.0;
    } else {
      padding = mobilePadding ?? 16.0;
    }

    return Padding(
      padding: EdgeInsets.all(padding),
      child: child,
    );
  }
}

/// A responsive text widget that adjusts font size based on screen size
class ResponsiveText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final double? mobileFontSize;
  final double? tabletFontSize;
  final double? desktopFontSize;

  const ResponsiveText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.mobileFontSize,
    this.tabletFontSize,
    this.desktopFontSize,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    double fontSize;
    if (screenWidth >= 1200) {
      fontSize = desktopFontSize ?? tabletFontSize ?? mobileFontSize ?? 16.0;
    } else if (screenWidth >= 800) {
      fontSize = tabletFontSize ?? mobileFontSize ?? 16.0;
    } else {
      fontSize = mobileFontSize ?? 16.0;
    }

    return Text(
      text,
      style: style?.copyWith(fontSize: fontSize) ?? TextStyle(fontSize: fontSize),
      textAlign: textAlign,
    );
  }
}

/// A responsive button layout that stacks on small screens and aligns horizontally on larger screens
class ResponsiveButtonRow extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final MainAxisAlignment mainAxisAlignment;
  final double? breakpoint;

  const ResponsiveButtonRow({
    super.key,
    required this.children,
    this.spacing = 8.0,
    this.mainAxisAlignment = MainAxisAlignment.spaceEvenly,
    this.breakpoint,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final breakpointWidth = breakpoint ?? 400.0;
    
    if (screenWidth < breakpointWidth) {
      // Stack vertically on small screens
      return Column(
        children: children.map((child) {
          return Padding(
            padding: EdgeInsets.only(bottom: children.indexOf(child) < children.length - 1 ? spacing : 0),
            child: SizedBox(width: double.infinity, child: child),
          );
        }).toList(),
      );
    } else {
      // Arrange horizontally on larger screens
      return Row(
        mainAxisAlignment: mainAxisAlignment,
        children: children.map((child) {
          return Expanded(child: child);
        }).toList(),
      );
    }
  }
}

/// Extension to get responsive breakpoints
extension ResponsiveBreakpoints on BuildContext {
  bool get isMobile => MediaQuery.of(this).size.width < 600;
  bool get isTablet => MediaQuery.of(this).size.width >= 600 && MediaQuery.of(this).size.width < 1200;
  bool get isDesktop => MediaQuery.of(this).size.width >= 1200;
  bool get isLandscape => MediaQuery.of(this).orientation == Orientation.landscape;
  bool get isPortrait => MediaQuery.of(this).orientation == Orientation.portrait;
  
  T responsive<T>({
    required T mobile,
    T? tablet,
    T? desktop,
  }) {
    if (isDesktop) return desktop ?? tablet ?? mobile;
    if (isTablet) return tablet ?? mobile;
    return mobile;
  }
  
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;
  double get safeAreaTop => MediaQuery.of(this).padding.top;
  double get safeAreaBottom => MediaQuery.of(this).padding.bottom;
}

/// A widget that automatically adjusts its layout based on screen size and orientation
class AdaptiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  final Widget? landscape;
  final Widget? portrait;

  const AdaptiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.landscape,
    this.portrait,
  });

  @override
  Widget build(BuildContext context) {
    final isLandscape = context.isLandscape;
    final isDesktop = context.isDesktop;
    final isTablet = context.isTablet;
    
    // Check orientation-specific layouts first
    if (isLandscape && landscape != null) {
      return landscape!;
    }
    if (!isLandscape && portrait != null) {
      return portrait!;
    }
    
    // Then check device-specific layouts
    if (isDesktop) {
      return desktop ?? tablet ?? mobile;
    } else if (isTablet) {
      return tablet ?? mobile;
    } else {
      return mobile;
    }
  }
}

/// A responsive container that adjusts its properties based on screen size
class ResponsiveContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? mobilePadding;
  final EdgeInsetsGeometry? tabletPadding;
  final EdgeInsetsGeometry? desktopPadding;
  final double? mobileMargin;
  final double? tabletMargin;
  final double? desktopMargin;
  final Color? color;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;

  const ResponsiveContainer({
    super.key,
    required this.child,
    this.mobilePadding,
    this.tabletPadding,
    this.desktopPadding,
    this.mobileMargin,
    this.tabletMargin,
    this.desktopMargin,
    this.color,
    this.borderRadius,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    EdgeInsetsGeometry padding;
    double margin;
    
    if (context.isDesktop) {
      padding = desktopPadding ?? tabletPadding ?? mobilePadding ?? const EdgeInsets.all(24);
      margin = desktopMargin ?? tabletMargin ?? mobileMargin ?? 16;
    } else if (context.isTablet) {
      padding = tabletPadding ?? mobilePadding ?? const EdgeInsets.all(20);
      margin = tabletMargin ?? mobileMargin ?? 16;
    } else {
      padding = mobilePadding ?? const EdgeInsets.all(16);
      margin = mobileMargin ?? 16;
    }

    return Container(
      margin: EdgeInsets.all(margin),
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: borderRadius,
        boxShadow: boxShadow,
      ),
      child: child,
    );
  }
}