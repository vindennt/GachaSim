import { View, Text, StyleSheet, SafeAreaView, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../api/FirebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { IconButton, Button as PaperButton } from "react-native-paper";
import moment from "moment";
import * as SKYTRAIN_DATA from "../../utils/SKYTRAIN_DATA";
import { getStationName } from "../../utils/SKYTRAIN_DATA";

type Buyable = {
  name: string;
  cost: number;
  itemid: string;
};

const Gacha = () => {
  const [user, setUser] = useState<User | null>(null);
  const auth = FIREBASE_AUTH;
  // const [displayName, displayName] = useState("string");
  const [displayName, setDisplayName] = useState<string | null>("default");
  const [uid, setUid] = useState<string>("default");
  const [money, setMoney] = useState(0);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setUid(user.uid);
        setDisplayName(user.displayName);
        console.log(
          uid + " with name " + displayName + " is currently logged in"
        );
      }
    });
    // Fetch money and gems
    const userRef = doc(FIRESTORE_DB, `users/${uid}`);
    const unsub = onSnapshot(userRef, (doc) => {
      console.log("Shop screen: Money fetch: ", doc.data());
      const userData = doc.data();
      setMoney(userData?.money);
      setGems(userData?.gems);
    });
    return () => unsub();
  }, [auth, displayName, uid, money]);

  const unlockStation = async (itemid: string) => {
    console.log("Unlocking " + getStationName(itemid));
    const date = moment().utcOffset("-08:00").format();
    await setDoc(doc(FIRESTORE_DB, "users", uid, "characters", itemid), {
      level: 1,
      fragments: 0,
      unlocked: true,
      dateUnlocked: date,
    });
  };
  const buyStationFragment = async (itemid: string) => {
    console.log("Bought 10 fragments for " + getStationName(itemid));
    await updateDoc(doc(FIRESTORE_DB, "users", uid, "characters", itemid), {
      fragments: increment(50),
    });
  };

  const renderItem = ({ item }: { item: Buyable }) => {
    return (
      <View style={styles.item}>
        <Text>{item.name}</Text>
        <PaperButton
          compact={true}
          icon="cash-multiple"
          style={styles.button}
          mode="elevated"
          textColor="black"
          labelStyle={{ fontSize: 16 }}
          buttonColor="whitesmoke"
          onPressIn={() => buyStationFragment(item.itemid)}
        >
          <Text style={styles.text}>{item.cost}</Text>
        </PaperButton>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.currencyContainer}>
        <PaperButton
          icon="cash-multiple"
          style={styles.button}
          mode="outlined"
          textColor="gray"
          labelStyle={{ fontSize: 20 }} // icon size
        >
          <Text style={styles.text}>{money}</Text>
        </PaperButton>
        <PaperButton
          icon="diamond-stone"
          style={styles.button}
          mode="outlined"
          textColor="royalblue"
          labelStyle={{ fontSize: 20 }} // icon size
        >
          <Text style={styles.text}>{gems}</Text>
        </PaperButton>
      </View>
    </View>
  );
};

export default Gacha;

const styles = StyleSheet.create({
  container: {
    // marginHorizontal: 10,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  button: {
    margin: 5,
    flexWrap: "wrap",
  },
  currencyContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  text: {
    fontSize: 16,
  },
  shopContainer: {
    width: "90%",
    maxWidth: "100%",
    maxHeight: "90%",
    // flex: 1,
    // backgroundColor: "pink",
  },
  item: {
    padding: 10,
    margin: 7,
    marginHorizontal: 14,
    borderRadius: 20,
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "cornflowerblue",
  },
});
