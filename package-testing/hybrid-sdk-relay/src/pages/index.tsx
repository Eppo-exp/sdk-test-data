import {getClient} from "@/eppo";
import {GetServerSideProps, InferGetServerSidePropsType} from "next";
import React, {useEffect} from "react";
import {offlinePrecomputedInit} from "@eppo/js-client-sdk";
import {clientAssignmentLogger} from "@/eppo-client";
import {ConfigurationWire} from "@eppo/js-client-sdk-common";
import {IPrecompute} from "@eppo/js-client-sdk/src/i-client-config";


export const getServerSideProps = (async () => {
    const client = await getClient();
    const precomputedPacket = JSON.stringify(client.getPrecomputedAssignments('mySubjectId', {country: 'US'}, false));

    return { props: { eppoConfig: precomputedPacket } };
}) satisfies GetServerSideProps<{ eppoConfig: string }>



export default function Home({
                                 eppoConfig,
                             }: InferGetServerSidePropsType<typeof getServerSideProps>)  {

    const [killSwitch, setKillSwitch] = React.useState(false);

    useEffect(() => {

        // Parse the initial config into what the precomputed client needs
        const configWire: ConfigurationWire = JSON.parse(eppoConfig);
        const subject = configWire.precomputed as IPrecompute;
        const precomputedResponse = JSON.parse(configWire.precomputed?.response ?? '{}');
        const assignments = precomputedResponse.flags;

       const client = offlinePrecomputedInit({
            precompute: subject,
            precomputedAssignments: assignments,
            assignmentLogger:clientAssignmentLogger,
        });

        setKillSwitch(client.getBooleanAssignment('kill-switch', false));

    }, [eppoConfig]);


    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <p>Hello, Eppo</p>
                <p>Kill Switch is {killSwitch}</p>
                <p>{eppoConfig}</p>
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
            </footer>
        </div>
    );
}
