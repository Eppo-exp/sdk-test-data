import {useEffect, useState} from "react";
import {init} from "@eppo/react-native-sdk";

interface IEppoClientProvider {
    waitForInitialization?: boolean;
    children: JSX.Element;
    loadingComponent?: JSX.Element;
}

const sdkKey = process.env.EXPO_PUBLIC_EPPO_SDK_KEY;


export default function EppoClientProvider({
                                                      waitForInitialization = true,
                                                      children,
                                                      loadingComponent = <div>Loading...</div>,
                                                  }: IEppoClientProvider): JSX.Element {
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        init({
            apiKey: sdkKey ?? "<YOUR-SDK-KEY>",
            assignmentLogger: {
                logAssignment(assignment) {
                    console.log(assignment);
                },
            },
        }).then(() => {
            return setIsInitialized(true);
        });
    }, []);

    if (!waitForInitialization || isInitialized) {
        return children;
    }
    return loadingComponent;
}