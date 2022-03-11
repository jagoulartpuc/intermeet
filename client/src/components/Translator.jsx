import React, { useState } from "react";

import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import { Grid, Paper, makeStyles, Button } from '@material-ui/core';
import SettingsVoiceIcon from '@material-ui/icons/SettingsVoice';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

const useStyles = makeStyles((theme) => ({
    gridContainer: {
        justifyContent: 'center',
        width: '800px',
        [theme.breakpoints.down('xs')]: {
            flexDirection: 'column',
        },
    },
    paper: {
        width: '550px',
        borderRadius: 15,
        padding: '10px',
        border: '2px solid black',
        margin: '10px',
    },
    margin: {
        marginTop: 20,
        width: '200px',
        marginLeft: '175px'
    },
    displayText: {
        fontSize: '30px',
        color: '#808080'
    }
}));

const Translator = () => {
    const [displayText, setDisplayText] = useState('Say something...');
    const [sourceLanguage, setSourceLanguage] = useState('pt-BR');
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [hided, setHided] = useState(false);
    
    const classes = useStyles();

    socket.on('chat.message', message => {
        setDisplayText(message)
    })

    const sttFromMic = (srcLanguage, targetLanguage) => {
        const speechConfig = speechsdk.SpeechTranslationConfig.fromSubscription('34ae0ab8255442c0b4b493ae07cefbab', 'eastus');
        speechConfig.speechRecognitionLanguage = srcLanguage;
        speechConfig.addTargetLanguage(targetLanguage);

        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.TranslationRecognizer(speechConfig, audioConfig);

        recognizer.recognizing = (s, e) => {
            //console.log(`RECOGNIZING: Text=${e.result.text}`);
        };

        recognizer.recognized = (s, e) => {
            if (e.result.reason == speechsdk.ResultReason.TranslatedSpeech) {
                var translation = e.result.translations.get(targetLanguage);
                console.log('[SOCKET] Chat.message => ', translation)
                socket.emit('chat.message', translation)
            }
            if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {

            }
            else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
            }
        };

        recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);

            if (e.reason == speechsdk.CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you update the key and location/region info?");
            }

            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.sessionStopped = (s, e) => {
            console.log("\n    Session stopped event.");
            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.startContinuousRecognitionAsync(() => console.log('started'), (err) => console.log('error', err));
        onChangeHided();

    }

    const onChangeSourceLanguage = (event) => {
        setSourceLanguage(event.currentTarget.value);
    }

    const onChangeTargetLanguage = (event) => {
        setTargetLanguage(event.currentTarget.value);
    }

    const onChangeHided = () => {
        setHided(true);
    }

    return (
        <Grid container className={classes.gridContainer}>
            {!hided ?
                <Paper className={classes.paper}>
                    <Box sx={{ minWidth: 40 }}>
                        <FormControl fullWidth>
                            <InputLabel variant="standard" htmlFor="uncontrolled-native">
                                Source language
                            </InputLabel>
                            <NativeSelect
                                onChange={onChangeSourceLanguage.bind(this)}
                                value={sourceLanguage}
                                defaultValue={sourceLanguage}
                                inputProps={{
                                    name: 'language',
                                    id: 'uncontrolled-native',
                                }}
                            >
                                <option value={'pt-BR'}>Portuguese</option>
                                <option value={'en-US'}>English</option>
                                <option value={'es-ES'}>Spanish</option>
                            </NativeSelect>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel variant="standard" htmlFor="uncontrolled-native">
                                Target language
                            </InputLabel>
                            <NativeSelect
                                onChange={onChangeTargetLanguage.bind(this)}
                                value={targetLanguage}
                                defaultValue={targetLanguage}
                                inputProps={{
                                    name: 'language',
                                    id: 'uncontrolled-native',
                                }}
                            >
                                <option value={'pt'}>Portuguese</option>
                                <option value={'en'}>English</option>
                                <option value={'es'}>Spanish</option>
                            </NativeSelect>
                        </FormControl>
                    </Box>
                    <Button variant="contained" color="inherit" fullWidth startIcon={<SettingsVoiceIcon fontSize="large" />} onClick={() => sttFromMic(sourceLanguage, targetLanguage)}
                        className={classes.margin}>
                        Start speaking
                    </Button>
                </Paper> : null}
            <div className={classes.displayText}>
                <code>{displayText}</code>
            </div>
        </Grid >

    );

}

export default Translator;