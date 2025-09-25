import { Platform } from 'react-native';

export const colors = {
  primary: {
    50: '#E6F6FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2',
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },
  neutral: {
    50: '#F5F7FA',
    100: '#E4E7EB',
    200: '#CBD2D9',
    300: '#9AA5B1',
    400: '#7B8794',
    500: '#616E7C',
    600: '#52606D',
    700: '#3E4C59',
    800: '#323F4B',
    900: '#1F2933',
  },
  success: {
    50: '#E3F9E5',
    100: '#C1F2C7',
    200: '#91E697',
    300: '#51CA58',
    400: '#31B237',
    500: '#18981D',
    600: '#0F8613',
    700: '#0E7817',
    800: '#07600E',
    900: '#014807',
  },
  warning: {
    50: '#FFFBEA',
    100: '#FFF3C4',
    200: '#FCE588',
    300: '#FADB5F',
    400: '#F7C948',
    500: '#F0B429',
    600: '#DE911D',
    700: '#CB6E17',
    800: '#B44D12',
    900: '#8D2B0B',
  },
  danger: {
    50: '#FFE3E3',
    100: '#FFBDBD',
    200: '#FF9B9B',
    300: '#F86A6A',
    400: '#EF4E4E',
    500: '#E12D39',
    600: '#CF1124',
    700: '#AB091E',
    800: '#8A041A',
    900: '#610316',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'Inter-Regular',
    }),
    medium: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
      default: 'Inter-Medium',
    }),
    semiBold: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'Inter-SemiBold',
    }),
    bold: Platform.select({
      ios: 'Inter-Bold',
      android: 'Inter-Bold',
      default: 'Inter-Bold',
    }),
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
    '4xl': 48,
    '5xl': 60,
  },
};

export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
};

export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  sm: Platform.select({
    web: {
      boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.18)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
  }),
  base: Platform.select({
    web: {
      boxShadow: '0px 2px 2.62px rgba(0, 0, 0, 0.23)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0px 4px 4.65px rgba(0, 0, 0, 0.30)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 6px 7.49px rgba(0, 0, 0, 0.37)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  }),
  xl: Platform.select({
    web: {
      boxShadow: '0px 8px 10.32px rgba(0, 0, 0, 0.44)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 16,
    },
  }),
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme; 