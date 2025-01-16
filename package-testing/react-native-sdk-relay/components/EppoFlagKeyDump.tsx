import {useEffect, useState} from "react";
import {EppoClient,getInstance, EppoReactNativeClient} from "@eppo/react-native-sdk";
import {ThemedText} from "@/components/ThemedText";
import {ScrollView} from "react-native";


interface IEppoFlagKeyDumpProps {}
export default function EppoFlagKeyDump(props: IEppoFlagKeyDumpProps) {

    const [flagKeys, setFlagKeys] = useState<string[]>([]);

    useEffect(() => {

        setFlagKeys(getInstance().getFlagKeys());

    }, []);

    return (
      <div className="eppo-flags">
         {flagKeys.map((flagKey) => (
              <div className="eppo-flag" key={flagKey}>
                  <pre>{flagKey}</pre>
              </div>
         ))}
      </div>
    );
}