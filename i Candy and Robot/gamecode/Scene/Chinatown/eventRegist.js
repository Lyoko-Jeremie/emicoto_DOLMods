iEvent.registEvent('Chinatown',{
    type: 'Event',
    episode: 'Intro',
    phase: 2,
    
    exit: 'BaseScene Chinatown',
    endcode: '<<run iEvent.setFlag("Chinatown", "intro", 1)>>',
    priority: 1000,
    require: ()=>{ return iEvent.getFlag('Chinatown', 'intro') == undefined && V.tvar.lastPassage !== 'BaseScene Chinatown' },
})


iEvent.registEvent('AlmondPath',{
    type: 'Event',
    episode: 'Intro',
    phase: 2,

    endcode: '<<run iEvent.setFlag("Chinatown", "known", 1)>><<set R.scene = "Chinatown">>',
    priority: 1000,

    leaveLink: ['Enter the Chinatown', '进入唐人街'],
    exit: 'BaseScene Chinatown',

    require: ()=>{ return iEvent.getFlag('Chinatown', 'known') == undefined && V.tvar.lastPassage !== 'BaseScene AlmondPath' },

})

iEvent.registEvent('Xinyu', {
    type: 'Chara',
    chara: 'Xinyu',

    episode: 'Talk',
    branch: 'Intro',
    eventnext: true,
    nextcode: '<<run iEvent.setFlag("Xinyu", "intro", 1); iEvent.unsetEvent()>>',
    priority: 1000,
    require: ()=>{ return iEvent.getFlag('Xinyu', 'intro') == undefined },
},
{
    type: 'Chara',
    chara: 'Xinyu',

    episode: 'Talk',
    branch: 'Friend',
    require: ()=>{ return iEvent.getFlag('Xinyu', 'intro') == 1 && C.npc['Xinyu'].love >= 40 },
},
{
    type: 'Chara',
    chara: 'Xinyu',

    episode: 'Talk',
    branch: 'Hate',
    require: ()=>{ return iEvent.getFlag('Xinyu', 'intro') == 1 && C.npc['Xinyu'].love <= -5},
},
{
    type: 'Chara',
    chara: 'Xinyu',

    episode: 'Talk',
    branch: 'General',
    require: ()=>{ return true },
})
