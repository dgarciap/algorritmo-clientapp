/**
 * HandlePlayer is in charge of playing the music while generated, generating 
 * the midi file, recording patterns and managing active patterns.
 */
var HandPlayer = {};

//Constant containing time between tones.
HandPlayer.INTERVAL_TIME = 31;
HandPlayer.TEMPO = 120; //beats per minute.

HandPlayer.NUM_TONES_PATTERN = 384;

//How hard the note hits, from 0-127.
HandPlayer.VELOCITY = 127;
//How long to hold the note, in seconds.
HandPlayer.DELAY = 0.031;

//Each tick last 8 ticks.
HandPlayer.NUMBER_TICKES_TONE = 8;

HandPlayer.midiStreamerLoaded = false;

HandPlayer.recordEnabled = false;
HandPlayer.timeSinceStartingToRecord = 0;

//Contains the pattern being generated currently.
HandPlayer.currentPatternArray = new Array(LeapManager.INSTRUMENT_LIST.length);

//Are we recording a pattern right now?
HandPlayer.patternRecordingEnabled = true;

/**
 * Array with active patterns.
 */
HandPlayer.activePatterns = [{index: 0, pattern: new Array(LeapManager.INSTRUMENT_LIST.length)}];

HandPlayer.timeoutId = undefined;

/**
 * One unit in our tone is TONE_GAP units on midi tones.
 * This means that tone 2 is in reality tone 2*HandPlayer.TONE_GAP.
 */
HandPlayer.TONE_GAP = 1;

/**
 * Contains information about a recorded track.
 * This is an array of arrays. Each sub-array corresponds to one instrument and 
 * hand.
 * We use 8 channels for each hand. We suppose both hands use the same instruments.
 * So left hand will use 0 to 4 channels and right hand will use 5 to 9. 
 * @type {Array}
 */
//HandPlayer.recordingArray = new Array(LeapManager.INSTRUMENT_LIST.length);

function onsuccess() {
    HandPlayer.midiStreamerLoaded = true;
}

/**
 * Given a hand type and an array of hands returns the first hand of this type.
 * @param  {[Array]} hands 
 * @param  {[string]} type
 */
HandPlayer.getLastHandWithType = function(hands, type) {
    for(var i =  hands.length-1; i >= 0; --i) 
        if(hands[i].type == type && hands[i].currentTone !== null) return i;
    return null;
}


/**
 * Given an index of recordingArray and a tone, adds this tone to the indicated 
 * instrument per hand sub-array.
 * @param  {[type]} instrumentIndex [description]
 * @param  {[type]} tone            [description]
 */
HandPlayer.applyCurrentTone = function(toneIndex, recordingArrayIndex, tone, destArray) {
    if(!destArray[recordingArrayIndex]) destArray[recordingArrayIndex] = [];
    
    var currentInsArray = destArray[recordingArrayIndex];
    currentInsArray[toneIndex] = {tones: [tone], numTimes:1};
}


/**
 * Adds an empty tone, a silence.
 * When our system plays a sound, each channel that is not sounding 
 * at this moment should have a silence. 
 */
HandPlayer.addSilence = function(toneIndex, recordingArrayIndex, destArray) {
    if(!destArray[recordingArrayIndex]) 
        destArray[recordingArrayIndex] = [];

    var currentInsArray = destArray[recordingArrayIndex];
    currentInsArray[toneIndex] = {tones: [-1], numTimes:1};
}

/**
 * Takes the pattern that was just generated and merge it with the current active
 * pattern. There will be just an active pattern, the one which will conform the 
 * resultant song.
 */
/*HandPlayer.activateCurrentPattern = function() {
    if(!this.patternRecordingEnabled) {
        if(this.activePatterns.length <= 0) this.activePatterns[this.activePatterns.length] = {index: -1, pattern: HandPlayer.currentPatternArray};
        else this.mergePatterns();
        //if(this.timeoutId) clearTimeout(this.timeoutId);
        //this.enablePatternRecording();
    }
}

HandPlayer.enablePatternRecording = function() {
    if(!this.patternRecordingEnabled) {
        this.currentPatternArray = new Array(HandPlayer.INSTRUMENT_PER_HAND*2);
        this.patternRecordingEnabled = true;
    }
}*/


HandPlayer.recordPattern = function(hands) {
    if(!this.activePatterns[0]) this.activePatterns[0] = {index: 0, pattern: new Array(LeapManager.INSTRUMENT_LIST.length)};
    this.record(this.activePatterns[0].index, hands, this.activePatterns[0].pattern);
}


/**
 * Given a certain point in time, record all notes that are played at this time.
 * @param  {[Array]} hands array of hands. We support just two hands (one right 
 * and one left) if more are provident they will be ignored.
 */
HandPlayer.record = function(toneIndex, hands, destArray) {
    for(var i = 0; i < LeapManager.INSTRUMENT_LIST.length; ++i) {
        if(hands.length > 0 && i == hands[0].instrumentIndex && typeof hands[0].currentTone === "number") 
            this.applyCurrentTone(toneIndex, i, hands[0].currentTone, destArray);
        else if(!destArray[i] || !destArray[i][toneIndex]) this.addSilence(toneIndex, i, destArray);
    }
}


HandPlayer.startRecording = function() {
    this.recordEnabled = true;
    this.timeSinceStartingToRecord = performance.now();
}


HandPlayer.isRecording = function() {
    return this.recordEnabled;
}


//Load Midi streamer
MIDI.loadPlugin({
    soundfontUrl: "./soundfonts/",
    instruments: _.map(LeapManager.INSTRUMENT_LIST, function(item){return item.name;}),
    onsuccess: onsuccess,
    onprogress: function(state, progress) {
        console.log(state, progress);
    },
});


/**
 * Given a raw tone (id comming from the hand position) returns its equivalent
 * tone in the MIDI format.
 */
HandPlayer.getValidTone = function(rawTone, channel) {
    var instIndex = LeapManager.getInstrumentFromChannel(channel);
    if(rawTone == -1) return rawTone;
    return rawTone * HandPlayer.TONE_GAP + LeapManager.INSTRUMENT_LIST[instIndex].firstToneId;
}

/**
 * Get the total number of ticks that a given note is sustained in the given channel
 * and index.
 * @return {[type]} [description]
 */
HandPlayer.getTimes = function(track, toneIndex, lastTones) {
    var offNote = track[toneIndex].tones[0];
    var counter = 0;

    for(var i = toneIndex; i >= 0; --i) {
        if(track[i].tones[0] !== offNote) break;
        else ++counter;
    }

    return counter*HandPlayer.NUMBER_TICKES_TONE; // Number of ticks per note.
}


/**
 * Given a channel, track and array of tones, add this tones to this track on
 * this channels. When a tone is -1 this is a silence, so we add nothing.
 * If all tones are silence we return false, otherwise we return true (tones added).
 * noteOn determines if we are indicating the start of a note or the end.
 *
 * wait is how much time we want to wait before playing the current note. 
 * (only when noteOn is true).
 *
 * NOTE: This is not prepared for cases where tones or lastTones have different
 * number of tones than 1.
 */
HandPlayer.addTonesToTrack = function(track, customTrack, toneIndex, tones, lastTones, channel, noteOn, wait) {
    wait = wait || 0;
    
    var isSilence = true;
    for(var i = 0; i < tones.length; ++i) {
        if(noteOn) {
            if(lastTones[0] !== tones[i] && tones[i] !== -1) {
                //If first note.
                if(isSilence) track.noteOn(channel, this.getValidTone(tones[i], channel), wait, HandPlayer.VELOCITY);
                else track.noteOn(channel, this.getValidTone(tones[i], channel));
                isSilence = false;
            }
        }
        else {
            if(lastTones[0] !== tones[i] && lastTones[0] !== -1) {
                var numTicks = this.getTimes(customTrack, toneIndex - 1, lastTones);
                //If first note.
                if(isSilence) track.noteOff(channel, this.getValidTone(lastTones[0], channel), numTicks);
                else track.noteOff(channel, this.getValidTone(lastTones[0], channel));
            }
        }
    }
    return !isSilence;
}


HandPlayer.fillTrackWithArray = function(track, trackArray) {
    var modifiedTrack = track;
    var wait = 0;
    for(var j = 0; trackArray[0] && j < trackArray[0].length; ++j) {
        var areTones = false;

        for(var i = 0; i < trackArray.length; ++i) 
            this.addTonesToTrack(track, trackArray[i], j, trackArray[i][j].tones, j == 0 ? [-1] : trackArray[i][j-1].tones, i, false);
        for(var i = 0; i < trackArray.length; ++i) 
            areTones = this.addTonesToTrack(track, trackArray[i], j, trackArray[i][j].tones, j == 0 ? [-1] : trackArray[i][j-1].tones, i, true, wait) || areTones;
        
        if(!areTones) wait += HandPlayer.NUMBER_TICKES_TONE;
        else wait = 0;
    }
}


HandPlayer.generateMidiFile = function() {
    this.recordEnabled = false;

    var file = new Midi.File();
    var track = new Midi.Track();
    file.addTrack(track);

    track.setTempo(this.TEMPO);

    for(var i = 0; i < LeapManager.INSTRUMENT_LIST.length; ++i) {
        track.setInstrument(i, LeapManager.INSTRUMENT_LIST[i].id);
        track.setInstrument(i+LeapManager.INSTRUMENT_LIST.length, LeapManager.INSTRUMENT_LIST[i].id);
    }

    //TODO: Erase.
    //fakeArray = [];
    //fakeArray[fakeArray.length] = [{id: 21, numTimes:2000}];

    this.fillTrackWithArray(track, this.activePatterns[0].pattern);
    //fillTrackWithArray(track, fakeArray);

    var str = file.toBytes();
    var bytes = [];

    for (var i = 0; i < str.length; ++i) {
        bytes.push(str.charCodeAt(i));
    }

    var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));

    base64String = "data:image/png;base64," + base64String;

    /*MIDI.Player.loadFile(base64String, function() {
        console.log("MIDI file generated.");
        //MIDI.Player.start(); // start the MIDI track (you can put this in the loadFile callback)
         MIDI.Player.resume(); // resume the MIDI track from pause.
            MIDI.Player.pause(); // pause the MIDI track.
            MIDI.Player.stop();
    },
    function() {
        console.log("Generating MIDI file.");
    },
    function() {
        console.log("Error generating MIDI file.");
    }); // load .MIDI from base64 or binary XML request.*/

    this.downloadSong(base64String);
    this.saveSongUsingLocalStorage(base64String);
}


HandPlayer.downloadSong = function(base64String) {
    //DonwloadFile
    var a = document.createElement('a');
    a.download = 'sample.mid';
    a.href = base64String;
    a.click();
};


HandPlayer.saveSongUsingLocalStorage = function(base64String) {
    localStorage.setItem("userGeneratedSong", base64String);
};

/*HandPlayer.recordActivePatterns = function(recordingArray) {
    for(var i = 0; i < this.activePatterns.length; ++i) {
        var activePattern = this.activePatterns[i];
        
        for(var j = 0; j < LeapManager.INSTRUMENT_LIST.length; ++j) {
            var cIndex = activePattern.index;
            recordingArray[j][recordingArray[j].length-1].tones = 
                recordingArray[j][recordingArray[j].length-1].tones.concat(
                    activePattern.pattern[j][cIndex].tones);
        }
    }
}*/


HandPlayer.moveActivePatternsForward = function() {
    for(var i = 0; i < this.activePatterns.length; ++i) {
        this.activePatterns[i].index = (this.activePatterns[i].index + 1) % HandPlayer.NUM_TONES_PATTERN;
    }
}


HandPlayer.playActivePatterns = function() {
    for(var i = 0; i < this.activePatterns.length; ++i) {
        var activePattern = this.activePatterns[i];
        cIndex = activePattern.index;
        lastIndex = activePattern.index - 1;
        for(var j = 0; j < LeapManager.INSTRUMENT_LIST.length; ++j) {
            var tones = activePattern.pattern[j][cIndex].tones;
            var lastTone = -1;
            var channel = LeapManager.INSTRUMENT_LIST[j].channel;
            if(lastIndex >= 0) lastTone = this.getValidTone(activePattern.pattern[j][lastIndex].tones[activePattern.pattern[j][lastIndex].tones.length - 1], channel);
            for(var k= 0; k < tones.length; ++k) {
                this.playTone(this.getValidTone(tones[k], channel), lastTone, j, LeapManager.INSTRUMENT_LIST[j%LeapManager.INSTRUMENT_LIST.length].id);
            }
        }
    }
}


HandPlayer.playTone = function(tone, lastTone, channel, instrument) {
    MIDI.programChange(channel, instrument);
    if(lastTone !== tone) {
        if(lastTone >= 0) MIDI.noteOff(channel, lastTone, 0);
        MIDI.noteOn(channel, tone, HandPlayer.VELOCITY);
    }
    //MIDI.noteOff(channel, tone, HandPlayer.DELAY);
}

HandPlayer.RENDERS_PER_SECOND = 4;

//Countdown to determine when to render.
//We are playing 32 tones per second and we don't want to render so many times.
//We'll render each 32/HandPlayer.RENDERS_PER_SECOND tones.
HandPlayer.renderCountdown = 32/HandPlayer.RENDERS_PER_SECOND;

/**
 * When invoke iterate over all registered hands and for each of this hands if
 * it has a toned assigned plays this tones and marks it as played.
 * @return {Boolean}        True if tones are able to be played, false otherwise.
 */
HandPlayer.processTones = function() {
    if(!this.midiStreamerLoaded) return false;

    --HandPlayer.renderCountdown;

    /*if(this.isRecording()) {
        this.record(LeapManager.handArray, this.recordingArray);
        this.recordActivePatterns(this.recordingArray);
    }*/

    this.recordPattern(LeapManager.handArray);

    this.playActivePatterns();
    this.moveActivePatternsForward();

    if(HandPlayer.renderCountdown === 0) {
        HandPlayer.renderCountdown = 32/HandPlayer.RENDERS_PER_SECOND;
        MakerViz.render(LeapManager.handArray[0] ? LeapManager.handArray[0].currentTone : null);
    }

    return true;
}