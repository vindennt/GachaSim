import { useNavigation } from "@react-navigation/native";
import DailyFocusBox from "@src/components/DailyFocusBox";
import QuickStartCard from "@src/components/QuickStartCard";
import { AuthState } from "@src/features/auth/authSlice";
import {
  UpdateUserRequest,
  updateUserData,
} from "@src/features/user/userSliceHelpers";
import { datesMatch } from "@src/utils/dates";
import * as React from "react";
import { useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import session from "redux-persist/es/storage/session";

const Missions = () => {
  const dispatch = useDispatch<any>();
  const theme = useTheme();
  const navigation = useNavigation();

  const session = useSelector(
    (state: { auth: AuthState }) => state.auth.session
  );

  // const dailyResetTime: Date = useSelector(
  //   (state: { user: UserState }) => state.user.daily_reset_time
  // );
  // const lastFocusDate: Date | null = useSelector(
  //   (state: { user: UserState }) => state.user.last_focus_date
  // );

  const handleDailyFocus = () => {
    const now: Date = new Date();
    // if (!datesMatch(new Date(lastFocusDate), now)) {
    if (!datesMatch(now, now)) {
      console.log("XXXXX NEW DAY: Restting daily missions");
      const updateRequest: UpdateUserRequest = {
        session: session,
        update: {
          daily_focus_time: 0,
          daily_reset_time: now,
          // last_focus_date: now,
        },
      };
      dispatch(updateUserData(updateRequest));
    }
  };

  useEffect(() => {
    // const testLastLoginDate = new Date(2023, 7, 1);
    const testLastLoginDate = new Date();
    const updateRequest: UpdateUserRequest = {
      session: session,
      update: {
        daily_reset_time: testLastLoginDate,
        last_focus_date: testLastLoginDate,
      },
    };
    dispatch(updateUserData(updateRequest));
    handleDailyFocus();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Missions.</Text>
      <DailyFocusBox />
      <QuickStartCard />
    </View>
  );
};

export default Missions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // margin: 8,
    // alignItems: "center",
    // justifyContent: "center",
    padding: 20,
    // backgroundColor: "pink",
  },
  text: {
    fontSize: 16,
  },
});