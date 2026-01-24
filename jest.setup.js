const matchers = require('@testing-library/react-native/matchers');
require('react-native-gesture-handler/jestSetup');

expect.extend(matchers);

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
