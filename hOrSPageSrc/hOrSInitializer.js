//Modify hOrSManager's goToPreviousPage method with the behavior when the user
//finish interacting with the hOrS page.
//
////Example:
/*HorSManager.goToPreviousPage = function goToPaintingPage(){
  page= "drawing";
  cleanCanvas();
  console.log('cleanCanvas: '+JSON.stringify(notes));
  canvas.style.display= 'block';
  listeningelement.style.display= 'none';
  noDrawingModeImg.style.display= 'block';
  shitIcon.className= "init";hitIcon.className= "init";
}*/

HorSManager.goToPreviousPage = function () {
    window.location.href = ResHelper.getMainUrl();
};

HorSManager.visUpdater = startVisualization("songtime");

//Load Midi streamer
MIDI.loadPlugin({
    soundfontUrl: ResHelper.getResPath() + "/soundfonts/",
    instruments: _.map(LeapManager.INSTRUMENT_LIST, function(item){return item.name;}),
    onsuccess: HorSManager.loadTrack.bind(HorSManager),
    onprogress: function(state, progress) {
        console.log(state, progress);
    },
});

d3.select("#hit").on("click", HorSManager.hitPressed.bind(HorSManager));

d3.select("#shit").on("click", HorSManager.shitPressed.bind(HorSManager));

//Load a song and start playing it.
//HorSManager.loadTrack();

/**
 * Leap motion loop processing user interaction for the hOrS page.
 */
Leap.loop({}, function(frame) {
    HorSManager.listeningPage(frame);
});
