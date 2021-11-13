import * as React from "react";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBarProps } from "./types";

const isSupportedPlatform =
  Platform.OS === "ios" ||
  (Platform.OS === "android" && Platform.Version >= 27);

export class StatusBar extends React.Component<StatusBarProps> {
  private static propsStack: StatusBarProps[] = [];
  private static immediate: NodeJS.Immediate | null = null;
  private static mergedProps: StatusBarProps | null = null;

  private static createStackEntry({
    animated = false,
    barStyle = "light-content",
  }: StatusBarProps): StatusBarProps {
    return { animated, barStyle };
  }

  static currentHeight = RNStatusBar.currentHeight ?? undefined;

  static pushStackEntry(props: StatusBarProps): StatusBarProps {
    const entry = StatusBar.createStackEntry(props);
    StatusBar.propsStack.push(entry);
    StatusBar.updatePropsStack();
    return entry;
  }

  static popStackEntry(entry: StatusBarProps): void {
    const index = StatusBar.propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar.propsStack.splice(index, 1);
    }
    StatusBar.updatePropsStack();
  }

  static replaceStackEntry(
    entry: StatusBarProps,
    props: StatusBarProps,
  ): StatusBarProps {
    const newEntry = StatusBar.createStackEntry(props);
    const index = StatusBar.propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar.propsStack[index] = newEntry;
    }
    StatusBar.updatePropsStack();
    return newEntry;
  }

  private static updatePropsStack() {
    // Send the update to the native module only once at the end of the frame.
    if (StatusBar.immediate !== null) {
      clearImmediate(StatusBar.immediate);
    }

    StatusBar.immediate = setImmediate(() => {
      const oldProps = StatusBar.mergedProps;
      const lastEntry = StatusBar.propsStack[StatusBar.propsStack.length - 1];

      if (
        isSupportedPlatform &&
        lastEntry != null &&
        // Update only if style have changed.
        (!oldProps || oldProps.barStyle !== lastEntry.barStyle)
      ) {
        RNStatusBar.setBarStyle(lastEntry.barStyle, lastEntry.animated);
      }

      // Update the current prop values.
      StatusBar.mergedProps = { barStyle: "light-content", ...lastEntry };
    });
  }

  private stackEntry: StatusBarProps | null = null;

  componentDidMount() {
    this.stackEntry = StatusBar.pushStackEntry(this.props);
  }

  componentDidUpdate() {
    if (this.stackEntry) {
      this.stackEntry = StatusBar.replaceStackEntry(
        this.stackEntry,
        this.props,
      );
    }
  }

  componentWillUnmount() {
    if (this.stackEntry) {
      StatusBar.popStackEntry(this.stackEntry);
    }
  }

  render(): React.ReactNode {
    return null;
  }
}