import { View, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../api/FirebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  Unsubscribe,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { IconButton, Button as PaperButton } from "react-native-paper";
import { getStationName } from "../../utils/SkytrainData";
import Popup from "../../components/Popup";
import { Reward, Tier, gachaRoll } from "../../utils/GachaHandler";
import {
  stationLevelUp,
  gachaPurchase,
  // giveFragment,
  unlockStation,
} from "../../utils/UnlockHandler";
import moment from "moment";
import { Character } from "../../components/TripMenu";
import GridSelector from "../../components/GridSelector";
import { LEVELUP_COSTS } from "../../utils/UnlockHandler";

const Team = () => {
  const [user, setUser] = useState<User | null>(null);
  const auth = FIREBASE_AUTH;
  // const [displayName, displayName] = useState("string");
  const [displayName, setDisplayName] = useState<string | null>("default");
  const [uid, setUid] = useState<string>("default");
  const [subscription, setSubscription] = useState<Unsubscribe>();
  const isFocused = useIsFocused();
  const [money, setMoney] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [colour, setColour] = useState<string>("red");
  const [unlockedCharList, setUnlockedCharList] = useState<Character[]>([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [canUpgrade, setCanUpgrade] = useState<boolean>(false);

  // var unlockedCharList: Character[] = [];
  const [character, setCharacter] = useState<string>("001");
  const [levelDisplay, setLevelDisplay] = useState<number>(0);
  // const [fragmentDisplay, setFragmentDisplay] = useState<number>(0);
  const [unlockedDateDisplay, setUnlockedDateDisplay] = useState<string>("");

  const setDisplayInfo = async (id: string) => {
    setLoadingData(true);
    console.log("Team: Selected character: " + getStationName(id));
    setCharacter(id);
    const docRef = doc(FIRESTORE_DB, `users/${uid}/characters/${id}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await setLevelDisplay(docSnap.data().level);
      // await setFragmentDisplay(docSnap.data().fragments);
      console.log(
        "Team: chekcing if can upgrade: $" +
          money +
          " VS cost: " +
          LEVELUP_COSTS[levelDisplay - 1]
      );
      if (money >= LEVELUP_COSTS[levelDisplay - 1]) {
        setCanUpgrade(true);
      } else {
        setCanUpgrade(false);
      }
      setLoadingData(false);
      // setUnlockedDateDisplay(docSnap.data().dateUnlocked);
    } else {
      throw new Error("Team menu: Doc does not exist for id " + id);
    }
  };

  const getUserCharacterData = async () => {
    if (subscription) {
      subscription(); // Call the subscription to unsubscribe
    }

    const charQuery = query(
      collection(FIRESTORE_DB, `users/${uid}/characters`),
      where("unlocked", "==", true)
    ); // refer to todos collection in firestore
    const newSubscription = onSnapshot(charQuery, {
      // observer
      next: async (snapshot) => {
        // console.log("UPDATING DISPLAYED TODOS");
        const fetchedChars: Character[] = []; // Array tracking todos of any type, not the same as the const
        await snapshot.forEach((doc) => {
          // console.log(doc.data()); // keep doc.data() instead of just doc to log relevant data
          fetchedChars.push({
            id: doc.id,
            name: getStationName(doc.id),
            ...doc.data(),
          } as Character); // necessary line to pass typecheck
        });
        setUnlockedCharList(fetchedChars); // set displayed list to fetched array
        if (unlockedCharList.length > 0) {
          setCharacter(unlockedCharList[0].id);
          setDisplayInfo(character);
        } else {
          console.log("Team: emoty Unlocked char list ");
        }

        setSubscription(newSubscription);
        // return () => subscriber(); // Remove subscription to clear it
      },
    });
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setUid(user.uid);
        setDisplayName(user.displayName);
        console.log(
          "Team screen: " +
            uid +
            " with name " +
            displayName +
            " is currently logged in"
        );
      }
    });

    if (user) {
      getUserCharacterData();
    }

    if (subscription) {
      subscription(); // Call the subscription to unsubscribe
    }

    // Fetch money and gems
    const userRef = doc(FIRESTORE_DB, `users/${uid}`);
    const unsub = onSnapshot(userRef, (doc) => {
      console.log("Team screen: Money fetch: ", doc.data());
      const userData = doc.data();
      setMoney(userData?.money);
      // console.log("Pity: " + pity);
    });

    return () => unsub();
  }, [auth, displayName, uid]);

  // Attempt level up
  const levelUp = async () => {
    setCanUpgrade(false);
    setLoadingData(true);
    const docRef = doc(FIRESTORE_DB, `users/${uid}/characters/${character}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentFragments: number = docSnap.data().fragments;
      console.log("Attempting level up for " + character);
      await stationLevelUp(character, money, levelDisplay, uid);
      setDisplayInfo(character);
      setCanUpgrade(true);
      setLoadingData(false);
    } else {
      setCanUpgrade(true);
      setLoadingData(false);
      throw new Error(
        "Team menu levelup: Doc does not exist for id " + character
      );
    }
  };

  const handleButtonClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scrollbarContainer}>
        <GridSelector
          characters={unlockedCharList}
          columns={1}
          onSelect={(item) => {
            setCanUpgrade(false);
            setDisplayInfo(item.id);
            setCharacter(item.id);
          }}
        />
      </View>
      <View style={styles.displayContainer}>
        <PaperButton
          icon="cash-multiple"
          style={styles.button}
          mode="outlined"
          textColor="gray"
          labelStyle={{ fontSize: 20 }} // icon size
        >
          <Text style={styles.text}>{money}</Text>
        </PaperButton>

        <View style={styles.nameContainer}>
          <Text style={styles.text}>{getStationName(character)}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.text}>Level: {levelDisplay}</Text>
          {/* <Text style={styles.text}>Fragments: {fragmentDisplay}</Text> */}
        </View>
        <View style={styles.levelContainer}>
          {/* <IconButton icon="trash-can-outline" size={20} iconColor="red" /> */}
          <PaperButton
            icon="cash-multiple"
            disabled={!canUpgrade}
            loading={loadingData}
            style={styles.button}
            mode="contained"
            buttonColor="orange"
            labelStyle={{ fontSize: 20 }} // icon size
            onPressOut={levelUp}
          >
            <Text style={styles.text}>
              {LEVELUP_COSTS[levelDisplay - 1]} {"  "} Level Up
            </Text>
          </PaperButton>
        </View>
      </View>
      <Popup
        visible={showPopup}
        text={popupText}
        onClose={handleClosePopup}
        backgroundColour={colour}
      />
    </View>
  );
};

export default Team;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "gray",
    flexDirection: "row",
  },
  button: {
    margin: 15,
    // flexWrap: "wrap",
  },
  currencyContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  text: {
    fontSize: 16,
  },
  scrollbarContainer: {
    flexWrap: "wrap",
    backgroundColor: "pink",
  },
  displayContainer: {
    // flexWrap: "wrap",
    flex: 1,
    height: "100%",
    backgroundColor: "lightgray",
    alignItems: "center",
    padding: 10,
  },
  nameContainer: {
    // flex: 1,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: "lavender",
    justifyContent: "center",
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "pink",
  },
});