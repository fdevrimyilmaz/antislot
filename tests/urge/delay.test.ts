/**
 * Delay Screen Tests
 * 
 * Tests for delay screen translation key usage and consistency.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Delay Screen Translation Keys', () => {
  it('should use urgeDelayStart and not urgeBreathingStart', () => {
    // Read the delay.tsx file content
    const delayFilePath = path.join(process.cwd(), 'app', 'urge', 'delay.tsx');
    const fileContent = fs.readFileSync(delayFilePath, 'utf8');
    
    // Assert that urgeDelayStart is used
    expect(fileContent).toContain('t.urgeDelayStart');
    
    // Assert that urgeBreathingStart is NOT used in the actual code
    // Remove comments to check only actual code
    const codeWithoutComments = fileContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, ''); // Remove line comments
    
    // Check that urgeBreathingStart is not used in the button text
    const startButtonMatch = codeWithoutComments.match(/startButtonText[^}]*\{t\.(\w+)\}/s);
    if (startButtonMatch) {
      expect(startButtonMatch[1]).toBe('urgeDelayStart');
    }
    
    // Ensure urgeBreathingStart is not present in the actual code
    expect(codeWithoutComments).not.toContain('urgeBreathingStart');
  });
});
