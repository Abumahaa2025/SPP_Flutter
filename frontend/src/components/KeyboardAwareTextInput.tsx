import React, { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

/** TextInput passthrough — parent ScreenScaffold handles keyboard inset. */
export const KeyboardAwareTextInput = forwardRef<TextInput, TextInputProps>(
  function KeyboardAwareTextInput(props, ref) {
    return (
      <TextInput
        ref={ref}
        {...props}
        blurOnSubmit={props.blurOnSubmit ?? false}
      />
    );
  },
);
