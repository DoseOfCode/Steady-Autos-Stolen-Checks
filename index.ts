import config from "./config.json";

import { Request, Response } from "express";
import express from "express";

import asyncHandler from "express-async-handler";

import axios from "axios";

const app = express();

let stolen_list = [];
let stolen_list_sync_time;

app.use(
    express.json()
);

app.get(
    '/facebook/webhook',

    asyncHandler(async (req: Request, res: Response) =>
    {

        let mode = req.query["hub.mode"];
        let token = req.query["hub.verify_token"];
        let challenge = req.query["hub.challenge"];
      
        if (mode && token) 
        {
            if (mode === "subscribe" && token === config.facebook.verify_token)
            {
                console.log("WEBHOOK_VERIFIED");

                return res.status(200).send(challenge);
            } 
            else 
            {
                return res.sendStatus(403);
            }
        }
    })
);

app.post(
    '/facebook/webhook',

    asyncHandler(async (req, res) =>
    {
        let body = req.body;

        if (body.object === 'page') 
        {
            for (let i = 0; i < body.entry.length; i++)
            {
                const entry = body.entry[i];

                const webhook_event = entry?.messaging?.[0];

                console.log(`[!] New Webhook Event`, JSON.stringify(webhook_event));

                const message = webhook_event?.message?.text?.trim();
                const self_send = webhook_event?.sender?.id === config.facebook.sender;

                if (!self_send && message)
                {
                    const vaild =
                        /^[a-zA-Z0-9]{2,6}$/.test(message) ||
                        /^[a-zA-Z0-9]{17}$/.test(message)

                    let messages_to_send = [
                        "Vehicle could not be found."
                    ];

                    if (!vaild)
                    {
                        messages_to_send = ["Invaild Plate/VIN"];
                    }
                    else
                    {
                        const result = await GetStolenData(message);

                        if (!result.success)
                        {
                            messages_to_send = ["Something went wrong on our end... try again later."];
                        }
                        else if (result.matches.length === 0)
                        {
                            messages_to_send = [
                                "\n\n✅ This vehicle is not currently reported stolen. If you still are unsure, you can check here: https://www.police.govt.nz/can-you-help-us/stolen-vehicles"
                            ];
                        }
                        else if (result.matches.length > 0)
                        {
                            messages_to_send = [
                                "\n\n🚩 This vehicle is currently reported stolen.  Confirm on the NZPolice Website.\n\n🔗 https://www.police.govt.nz/can-you-help-us/stolen-vehicles"
                            ];
                        }
                        else
                        {
                            messages_to_send = ["Something went wrong on our end... try again later"]
                        }
                    }

                    for (let x = 0; x < messages_to_send.length; x++)
                    {
                        const message = messages_to_send[x];

                        try
                        {
                            await axios.post(
                                `https://graph.facebook.com/v11.0/me/messages?access_token=${config.facebook.page_token}`,
                                {
                                    message:   { text: message },
                                    recipient: { id: webhook_event.sender.id }
                                }
                            );
                        }
                        catch (err) 
                        {
                            console.log(err.message);
                        }
                    }
                }
            }

            return res.status(200).send('EVENT_RECEIVED');
        } 
        else 
        {
            return res.sendStatus(404);
        }
    })
);

app.listen(
    config.express.port, 
    () => console.log(`[Express] Listening on port`, config.express.port)
);

async function Update()
{
    try
    {
        const response = await axios({
            url: "https://www.police.govt.nz/stolenwanted/vehicles/csv/download?tid=&all=true&gzip=false&full=true",
            method: 'GET'
        });

        stolen_list = [];

        const response_list = response.data.split("\n");

        for (let i = 0; i < response_list.length; i++)
        {            
            let result = response_list[i].split(",");

            stolen_list.push({
                identifiers: [result[0] ?? "", result[1] ?? "", result[2] ?? "", result[3] ?? ""],

                colour: result[4],
                make:   result[5],
                model:  result[6],
                year:   result[7],
                type:   result[8],

                stolen_at:      result[9] ?? null,
                stolen_from:    result[10]
            });
        }

        console.log('Log Time', new Date());
        console.log('New List Length', stolen_list.length);
        console.log('New List Idx 20', JSON.stringify(stolen_list[20]));
    
        stolen_list_sync_time = Date.now();
    }
    catch (err)
    {
        console.log("[NZPolice] Failed to update database", err.message);

        await new Promise((r: any) => setTimeout(() => r(), 60000));

        return Update();
    }

    setTimeout(() => Update(), 60000 * 10);
}

async function GetStolenData(plate_vin_chassis: string)
{
    if (stolen_list_sync_time < Date.now() - 3600000)
    {
        return {
            success: false,
            message: "List is out of sync.  Was last synced @ " + stolen_list_sync_time
        };
    }

    if (stolen_list.length < 100000)
    {
        return {
            success: false,
            message: "List includes an abormally less amount of entries than it should."
        }
    }

    plate_vin_chassis = plate_vin_chassis.toLowerCase();

    const matches = stolen_list.filter(item =>
        item.identifiers.some((x: string) => x.toLowerCase() === plate_vin_chassis)
    );

    console.log(`[!] Got ${plate_vin_chassis.toUpperCase()} matches`, JSON.stringify(matches));

    return {
        success: true,
        matches
    };
}

Update();