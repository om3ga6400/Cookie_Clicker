var M={};
M.parent=Game.Objects['Factory'];
M.parent.minigame=M;
M.launch=function()
{
	var M=this;
	M.name=M.parent.minigameName;
	M.init=function(div)
	{
		M.mouseOn=false;
		AddEvent(div,'mouseover',function(){M.mouseOn=true;});
		AddEvent(div,'mouseout',function(){M.mouseOn=false;});
		
		M.c=function(str){return choose(str.split('|'));};//M.c('a|b|c') > returns a, b or c
		
		//populate div with html and initialize values
		
		/*pattern explanation :
			M.Maker lets us create stuff that creates stuff, ie. to define constructors
			all objects created are expected to have at least .name
			this automatically creates 2 indices for the created objects : indexed by id and indexed by name
			"init" parameter is an optional function that is run on the created object before assigning its variables
			"body" parameter is the same, but run after variables are assigned
			M.Glob is an object whose values will be used as base variables for any subsequently created objects; ie. "all new objects created after this have .type=3"
		*/
		M.Glob={};
		M.last=0;
		M.prev=0;
		M.Maker=function(name,init,body,opts)
		{
			let options=opts||{};
			M[name]=[];
			M[name+'BN']={};
			M.Glob={};
			M.last=0;
			return function(o)
			{
				if (init) init(this);
				this.id=M[name].length;
				for (var i in M.Glob){this[i]=M.Glob[i];}
				for (var i in o){this[i]=o[i];}
				if (body) body(this);
				M[name].push(this);M[name+'BN'][this.name]=this;
				if (!options.noPrev)
				{
					M.prev=M.last;
					M.last=this;
				}
				return this;
			}
		}
		
		//heroes
		M.hero=M.Maker('heroes',function(me){
		},function(me){
			me.nameD=me.nameD||me.name;
		});
			M.hero.prototype.say=function(str)
			{
				if (this==M.nullHero) return false;
				if (this.text[str]) str=M.c(this.text[str]);
				else return false;
				M.log('<b>'+this.nameD+' :</b> '+str,0,this.sprite);
			};
			M.randomHero=function()
			{
				var arr=[];
				for (var i in M.team)
				{
					if (M.team[i].hero) arr.push(M.team[i].hero);
				}
				if (arr.length>0) return choose(arr); else return M.nullHero;
			}
			M.randomHeroNot=function(not)
			{
				if (!Array.isArray(not)) not=[not];
				var arr=[];
				for (var i in M.team)
				{
					if (M.team[i].hero && not.indexOf(M.team[i].hero)==-1) arr.push(M.team[i].hero);
				}
				if (arr.length>0) return choose(arr); else return M.nullHero;
			}
			
			M.nullHero=new M.hero({
				name:'null',nameD:'Null',
				pic:0,sprite:[0,0],
				desc:"",
				text:{
				},
				mgt:1,grd:1,spd:1,ddg:1,lck:1,
			});
		/*
			-an effective hero's stats are computed from the base values defined here, multiplied by 5, multiplied by bonuses from equipped gear, multiplied by (1+0.1*level)
				-may be subject to change
			-a hero may also have a gem ingested, multiplying one or more stats further (ingesting another gem replaces this bonus)
			-leveling : your whole party shares an xp gauge; you get XP for beating monsters, but every level the monster is below you halves the XP gained; XP needed for next level is doubled with each level
			-note : enemy stats should roughly fit their level the way hero stats do
			-you start with Chip and unlock new heroes in later towns
			-eventually, more than 4 heroes will be added; you'll be able to swap them out in town
			
			stats :
				-mgt : Might - how hard we hit
				-grd : Guard - how much damage we mitigate
				-spd : Speed - how often we attack (in attacks per second)
				-ddg : Dodge - how often we avoid attacks (mitigated by enemy's speed)
				-lck : Luck - determines lucky blows and, for heroes, item drop rates
		*/
		
		M.lvl=1;
		M.xp=0;
		
		M.xpToNext=function(lvl)
		{
			//how many xp is needed for the whole current level
			/*
				-the team gains xp by defeating enemies; an enemy's xp drop is equal to its level, minus 1 for each level the team has over it, minimum 1; some foes (bosses etc) have xp multipliers
				-the curve is designed based on how many foes of our level it takes to advance to the next level; it assumes manual killing in early game, and a shift to idle farming later on
				-based on this formula, some milestones require the following xp :
					lvl 2 	: 	13 kills
					lvl 10 	:	73 kills
					lvl 25 	:	707 kills
					lvl 50 	:	20,000 kills
					lvl 100 :	16 million kills
				as such, progress speed slows down steadily, barring special tricks and boosts
				at one enemy per second, lvl 50 would take 5 and a half hours of idling
			*/
			var lvl=lvl||M.lvl;
			return Math.round(10+Math.pow(lvl*2,2+lvl*0.02));
		}
		//for (var i=1;i<=100;i++){console.log('lvl ',i,':',Beautify(M.xpToNext(i)),'xp (',Beautify(M.xpToNext(i)/i),' enemy kills of same level)');}
		
		M.updateXPdisplay=function()
		{
			M.lvlL.innerHTML='Lvl '+Beautify(M.lvl);
			M.xpL.innerHTML='XP : '+Beautify(M.xp)+'/'+Beautify(M.xpToNext());
			M.xpBar.style.width=Math.floor((M.xp/M.xpToNext())*100)+'%';
		}
		M.gainXP=function(xp)
		{
			if (xp<=0) return false;
			M.xp+=xp;
			M.lvlsGained=0;
			while (M.xp>=M.xpToNext())
			{
				M.xp-=M.xpToNext();
				M.lvl++;
				M.lvlsGained++;
			}
			M.xp=Math.floor(M.xp);
			if (M.lvlsGained>0)
			{
				M.log('You are now lvl '+Beautify(M.lvl)+'!','black');
				M.burst('<div style="color:#f2df5e;text-shadow:0px 0px 4px #000,0px 0px 16px #f2df5e;">Level up</div>');
			}
			//if (M.lvlsGained>0) M.log('You gained '+Beautify(M.lvlsGained)+' level'+(M.lvlsGained==1?'':'s')+'!','black');
			M.updateXPdisplay();
		}
		
		M.Glob={};
		new M.hero({
			name:'chip',nameD:'Chip',
			pic:0,sprite:[0,3],
			desc:"I'm Chip!<br>I just really like exploring stuff.<br>Let's go have an adventure!",
			text:{
				'greeting':"Hello there!|I'm ready!|Where are we going today?|Adventure!",
				'go':"Here we go!|On my way!|Moving out!|Make way!",
				'enter':"Chipping in!|Welp, here goes nothing!|I wonder what I'll find!|Hey, this place is new!|This place seems familiar.|Let's make it happen.",
				'die':"B-better luck next time.|That really hurt!|I yield! I yield!|That went badly.|No half-baked excuses next time.|I think I scraped my knee!|Owie.|Woopsie!",
				'rest':"Nothing like a good night's rest!|That was refreshing!",
			},
			mgt:1,grd:1,spd:1,ddg:1,lck:1,
		});
		
		new M.hero({
			name:'crumb',nameD:'Crumb',
			pic:1,sprite:[1,3],
			desc:"I'm Crumb.<br>I got caught in a baking<br>accident when I was little...<br>I guess it made me tougher.",
			text:{
				'greeting':"Hi there.|Ready for adventure, I guess.|Reporting for duty.",
				'go':"Heading out.|Let's go.|You're the boss.|You go first.",
				'enter':"Let's do this, I guess.|Well, let's go...|I gotta go in there?|Are we really doing this?|I hope I won't get lost like last time.|Let's get this over with.",
				'die':"I, uh, ouch.|Why does that always happen to me?|I'm just no good, am I?|Oh no.|I'm... I'm not crying.|Well that wasn't fun at all.|I'm sorry I failed you.|Please... make them go away...",
				'rest':"I didn't want to wake up...|Oh, good morning.",
			},
			mgt:1,grd:1.2,ddg:0.9,spd:0.9,lck:1,
		});
		
		new M.hero({
			name:'doe',nameD:'Doe',
			pic:2,sprite:[2,3],
			desc:"H-hey. Name's Doe. I'm pretty fast.<br>I uh, I promise I'll do my best.",
			text:{
				'greeting':"H-hey.|Oh, uh, h-hi there.|C-can I join?",
				'go':"Oh, geez...|Alright then...|O-over there?|N-noted.",
				'enter':"Alright, let's do this!|I-if I really have to.|I-in there? Do I have to?|...won't you come with me this time?|H-here I go!",
				'die':"I-if you can't beat them... join them.|I-it's because I stutter, isn't it?|W-well that's just no good at all.|I, uh, I meant for that to happen.|H-how embarrassing.",
				'rest':"S-sleeptime? Over?|O-oh, is it morning already?",
			},
			mgt:0.9,grd:0.9,spd:1.2,ddg:1,lck:1,
		});
		
		new M.hero({
			name:'lucky',nameD:'Lucky',
			pic:3,sprite:[3,3],
			desc:"Oh hey! My name's Lucky.<br>Guess what I'm good at?",
			text:{
				'greeting':"I'm feeling lucky!|It's a bright day today!|Let's do great things together.",
				'go':"Weee!|Let's do this!|That's the way!|I'll check my compass!",
				'enter':"Glad to be of service!|Oooh this one'll be interesting.|This will be a good one, I can feel it!|Here I come!",
				'die':"I can't believe it!|...This is a joke, right?|Hey! No fair!|B-but...|I'm gonna need a bandaid. And some hot chocolate.|I'll, uh, try again later.|Bad luck! Bad luck!",
				'rest':"It's a brand new day!|All rested. Outlook : favorable!",
			},
			mgt:1,grd:0.9,spd:0.9,ddg:1,lck:1.2,
		});
		
		
		
		
		//foes (even in Cookie Clicker, FOE!)
		M.foe=M.Maker('foes',function(me){
			me.pic=[0,0];me.dim=[1,1];//.dim is how many tiles the icon takes
			me.stats={};
			me.lvl=1;
			me.loot={};
		});
		
		M.Glob={};
		
		//stats are determined by .lvl and are normally set equal, but the distribution can be changed with .stats (ie. .stats:{hp:1.5,speed:0.7} will make the foe have 50% more hp, but 30% less speed)
		
		new M.foe({name:'doughling',pic:[0,2],lvl:1,});
		new M.foe({name:'elder doughling',pic:[1,2],lvl:4,});
		new M.foe({name:'baby sentient cookie',pic:[0,1],lvl:1,});
		new M.foe({name:'raw sentient cookie',pic:[1,1],lvl:2,});
		new M.foe({name:'angry sentient cookie',pic:[1,1],lvl:3,});
		new M.foe({name:'burnt sentient cookie',pic:[2,1],lvl:4,});
		
		new M.foe({name:'crazed kneader',pic:[0,0],lvl:2,});
		new M.foe({name:'crazed chip-spurter',pic:[0,0],lvl:3,});
		new M.foe({name:'alarm bot',pic:[0,0],lvl:1,stats:{spd:2,mgt:0.5}});
		new M.foe({name:'disgruntled worker',pic:[0,0],lvl:3,});
		new M.foe({name:'disgruntled overseer',pic:[0,0],lvl:5,});
		new M.foe({name:'disgruntled janitor',pic:[0,0],lvl:3,});
		
		
		
		M.slots=[];
		M.slot=function(o)
		{
			var o=o||{};
			this.item=0;
			this.l=0;
			this.accept=o.accept||'any';
			this.id=o.id||0;
			this.n=M.slots.length;
			M.slots[this.n]=this;
		}
		M.slot.prototype.refresh=function()
		{
			if (!this.l) return false;
			if (this.item)
			{
				this.l.style.backgroundPosition=(-this.item.type.icon[0]*48)+'px '+(-this.item.type.icon[1]*48)+'px';
				this.l.classList.remove('dungeonEmptySlot');
			}
			else
			{
				this.l.classList.add('dungeonEmptySlot');
			}
		}
		M.slot.prototype.write=function(id)
		{
			if (id) this.id=id;
			return '<div class="dungeonItem dungeonSlot dungeonEmptySlot" id="'+this.id+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.slotTooltip('+this.n+')','this')+'></div>';
		}
		M.slot.prototype.bind=function()
		{
			if (!this.id) {console.log('ERROR : couldn\'t bind',this);return false;}
			this.l=l(this.id);
			AddEvent(this.l,'click',function(slot){return function(){slot.click();}}(this));
			AddEvent(this.l,'mouseover',function(slot){return function(){slot.hover();}}(this));
			AddEvent(this.l,'mouseout',function(slot){return function(){slot.hoverOff();}}(this));
		}
		M.slot.prototype.click=function()
		{
			if (M.dragging)
			{
				if (this.accept=='any' || this.accept==M.dragging.type.type)
				{
					var wasDragging=M.dragging;
					M.stopDragging();
					this.hoverOff();
					wasDragging.slotIn(this);
				}
			}
			else
			{
				if (this.item) M.startDragging(this.item);
			}
			Game.tooltip.hide();
		}
		M.slot.prototype.hover=function()
		{
			//if (M.dragging && (this.accept=='any' || this.accept==M.dragging.type.type)) this.l.classList.add('dungeonSlotAccept');
		}
		M.slot.prototype.hoverOff=function()
		{
			//this.l.classList.remove('dungeonSlotAccept');
		}
		M.slotTooltip=function(n)
		{
			return function()
			{
				var me=M.slots[n];
				var item=me.item||0;
				if (item)
				{
					var tags=[];
					tags.push(M.itemTypes[item.type.type]);
					var icon=item.type.icon;
					var title=item.type.nameD;
					var str=item.type.desc||'It\'s an item with no description.';
					if (tags.length>0) str='<div style="font-variant:small-caps;font-size:85%;opacity:0.75;margin-bottom:8px;">['+tags.join('] [')+']</div>'+str;
					return '<div class="prompt" style="width:250px;text-align:center;"><h3 style="margin:4px 32px;">'+title+'</h3><div class="block"><div class="icon" style="background:url('+Game.resPath+'img/dungeonItems.png?v='+Game.version+');float:left;margin-left:-8px;margin-top:-8px;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+str+'</div></div>';
				}
				else return '<div class="prompt" style="width:200px;text-align:center;padding:8px;">This is an empty slot.</div>';
			}
		}
		
		M.dragging=0;//the item being dragged
		M.dragDraw=function()
		{
			if (!M.dragging) return false;
			/*var box=M.bounds;
			var x=Game.mouseX-box.left-12;
			var y=Game.mouseY-box.top+12;*/
			var x=Game.mouseX-12;
			var y=Game.mouseY+12;
			M.dragL.style.transform='translate('+(x)+'px,'+(y)+'px)';
		}
		M.startDragging=function(item)
		{
			if (!item) return false;
			if (item.slot) {item.slot.item=0;item.slot.refresh();item.slot=0;}
			M.dragging=item;
			M.dragL.innerHTML='<div class="dungeonItem dungeonSlot dungeonCursor puckerHalf" style="background-position:'+(-M.dragging.type.icon[0]*48)+'px '+(-M.dragging.type.icon[1]*48)+'px;"></div>';
			M.dragDraw();
			M.dragL.classList.add('dungeonDragOn');
			
			for (var i in M.slots)
			{
				var it=M.slots[i];
				if (it.l)
				{
					if (/*it.accept=='any' || */it.accept==M.dragging.type.type) it.l.classList.add('dungeonSlotAccept');
					else if (it.accept!='any') it.l.classList.add('dungeonSlotNoAccept');
					//todo : stat boosts should highlight the hero portraits+name
				}
			}
		}
		M.stopDragging=function()
		{
			M.dragging=0;
			M.dragL.classList.remove('dungeonDragOn');
			M.dragL.innerHTML='';
			
			for (var i in M.slots)
			{
				var it=M.slots[i];
				if (it.l)
				{
					it.l.classList.remove('dungeonSlotAccept');
					it.l.classList.remove('dungeonSlotNoAccept');
				}
			}
		}
		
		//note : hero gear is tied to the hero's slot, not the hero itself; as such, swapping in a hero will give it the same items as the hero being swapped out
		M.team=[];
		//{hero,hp,hpm,gear}
		
		for (var i=0;i<4;i++)
		{
			var hero={
				i:i,
				hero:null,
				hp:0,hpm:0,
				l:null,hpl:null,picl:null,sprite:null,
				t:0,//attack cooldown
				gear:[],
				eff:[],
				x:-10000,y:0,//sprite position
				stats:{mgt:1,grd:1,spd:1,ddg:1,lck:1},//recomputed when needed
			};
			hero.gear[0]=new M.slot({accept:'weapon'});
			hero.gear[1]=new M.slot({accept:'armor'});
			hero.gear[2]=new M.slot({accept:'acc'});
			hero.gear[3]=new M.slot({accept:'stat'});
			M.team.push(hero);
		}
		M.heroEquip=function(i,item)
		{
			//returns the slot it got equipped in, otherwise, return false
			//i is the hero's slot id
			var prev=0;
			var slot=0;
			var hero=M.team[i];
			if (item.type.type=='weapon') slot=hero.gear[0];
			else if (item.type.type=='armor') slot=hero.gear[1];
			else if (item.type.type=='acc') slot=hero.gear[2];
			else if (item.type.type=='stat') slot=hero.gear[3];
			if (!slot) return false;
			prev=slot.item;
			item.slotIn(slot);
			if (prev && item.type.type!='stat') M.getItem(prev);//we only get the item back if it's not a stat booster
			return slot;
		}
		M.heroComputeStats=function(hero)
		{
			if (!hero.hero) return false;
			var me=hero.hero;
			var lvl=M.lvl-1;
			hero.hpm=10+(lvl);
			hero.stats.mgt=Math.floor(5*(1+0.1*lvl)*me.mgt);
			hero.stats.grd=Math.floor(5*(1+0.1*lvl)*me.grd);
			hero.stats.spd=Math.floor(5*(1+0.1*lvl)*me.spd);
			hero.stats.ddg=Math.floor(5*(1+0.1*lvl)*me.ddg);
			hero.stats.lck=Math.floor(5*(1+0.1*lvl)*me.lck);
		}
		
		M.setTeam=function(arr,noReset)
		{
			var str='';
			for (var i=0;i<arr.length;i++)
			{
				var me=arr[i];
				if (typeof me==='string') me=M.heroesBN[me];
				var hero=M.team[i%4];
				hero.hero=me;
				
				str+='<div class="dungeonHero" id="dungeonHero-'+i+'"><div class="dungeonHeroPic" style="background-position:0px '+(-me.pic*32)+'px;" id="dungeonHeroPic-'+i+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.heroTooltip('+i+')','this')+'></div><div class="dungeonHPwrap"><div id="dungeonHeroHP-'+i+'" class="dungeonHP"></div></div>'+
					me.nameD+
					'<div class="dungeonHeroItems">'+
						hero.gear[0].write('dungeonHeroSlot-'+i+'-0')+
						hero.gear[1].write('dungeonHeroSlot-'+i+'-1')+
						hero.gear[2].write('dungeonHeroSlot-'+i+'-2')+
					'</div>'+
				'</div>';
			}
			l('dungeonParty').innerHTML=str;
			
			for (var i=0;i<arr.length;i++)
			{
				var hero=M.team[i%4];
				hero.l=l('dungeonHero-'+i);
				hero.hpl=l('dungeonHeroHP-'+i);
				hero.picl=l('dungeonHeroPic-'+i);
				hero.gear[0].bind();
				hero.gear[1].bind();
				hero.gear[2].bind();
				M.heroComputeStats(hero);
				if (!noReset) hero.hp=hero.hpm;
				else hero.hp=Math.min(hero.hp,hero.hpm);
			}
		}
		M.refreshTeam=function()
		{
			var arr=[];
			for (var i=0;i<4;i++)
			{
				if (M.team[i].hero) arr.push(M.team[i].hero);
				hero.gear[0].refresh();
				hero.gear[1].refresh();
				hero.gear[2].refresh();
				hero.gear[3].refresh();
			}
			M.setTeam(arr,true);
			M.updateTeamStatus();
			for (var i=0;i<4;i++)
			{
				if (M.team[i].hero)
				{
					M.team[i].gear[0].refresh();
					M.team[i].gear[1].refresh();
					M.team[i].gear[2].refresh();
					M.team[i].gear[3].refresh();
				}
			}
		}
		M.heroTooltip=function(i)
		{
			return function()
			{
				var me=M.team[i];
				var str='';
				str+='<div style="text-align:left;"><q style="margin-top:0px;">'+me.hero.desc+'</q></div>';
				str+='<div class="line"></div>';
				str+='<div style="width:100%;clear:both;line-height:100%;">';
					str+=M.picto('lvl',M.lvl);
					str+=M.picto('hp',me.hp,me.hpm);
					//str+='<div class="dungeonStat">Level :</div> <div class="dungeonStatVal">'+M.lvl+'</div>';
					//str+='<div class="dungeonStat">Health :</div> <div class="dungeonStatVal">'+('<span style="color:#'+(me.hp<=0?'f00':'3f3')+';">'+me.hp+'</span>')+'/'+me.hpm+'</div>';
					str+='<div class="line"></div>';
					str+='<div style="background:rgba(57,150,160,0.25);box-shadow:0px 1px 2px rgba(108,215,181,0.5) inset;border-radius:12px;padding:6px;">';
						str+='<div class="shadowFilter">';
							str+=M.picto('mgt',me.stats.mgt);
							str+=M.picto('grd',me.stats.grd);
							str+=M.picto('spd',me.stats.spd);
							str+=M.picto('ddg',me.stats.ddg);
							str+=M.picto('lck',me.stats.lck);
						str+='</div>';
					str+='</div>';
				str+='</div>';
				return '<div class="prompt" style="width:250px;text-align:center;"><h3 style="margin:4px 32px;">'+me.hero.nameD+'</h3><div class="block"><div class="dungeonHeroPic crisp shadowFilter" style="background-position:0px '+(-me.hero.pic*32)+'px;margin-top:-41px;margin-left:0px;transform:scale(2);transform-origin:50% 100%;"></div>'+str+'</div></div>';
			}
		}
		
		M.picto=function(name,val,val2)
		{
			if (name=='hp')
			{
				return '<div class="dungeonStat" style="width:32%;"><div style="opacity:0.5;display:inline-block;">HP :</div> <b>'+(val)+'/'+(val2)+'</b></div>';
			}
			else if (name=='lvl')
			{
				return '<div class="dungeonStat" style="width:32%;"><div style="opacity:0.5;display:inline-block;">Level</div> <b>'+(val)+'</b></div>';
			}
			else
			{
				var icon=[0,0];
				if (name=='mgt') icon[1]=0;
				else if (name=='grd') icon[1]=1;
				else if (name=='spd') icon[1]=2;
				else if (name=='ddg') icon[1]=3;
				else if (name=='lck') icon[1]=4;
				else if (name=='gold') icon[1]=5;
				return '<div class="dungeonStat" style="width:32%;"><div style="background-image:url('+Game.resPath+'img/dungeonPictos.png?v='+Game.version+');background-position:'+(-icon[0]*16)+'px '+(-icon[1]*16)+'px;width:16px;height:16px;display:inline-block;vertical-align:middle;"></div>'+(val?'<b>'+val+'</b>':'')+'</div>';
			}
		}
		
		
		//items
		M.Glob={};
		M.item=M.Maker('items',function(me){
			me.icon=[0,0];
			me.stackN=0;
			me.type='misc';
			me.desc='???';
			me.stats={};
			/*
				how stats work :
				item.stats={mgt:1} - adds +1 to mgt while equipped
				item.stats={mgtM:2} - multiplies mgt by 2 while equipped (after additive boosts)
				item.stats={f:function(hero,stats){return {mgt:stats.mgt+M.gold}}} - calls a function when computing stats (after additive and multiplicative boosts); sets the specified stats
			*/
		},function(me){
			me.nameD=me.nameD||me.name;
		});
		M.itemTypes={
			'weapon':'Weapon',
			'acc':'Accessory',
			'armor':'Armor',
			'stat':'Boost',
			'junk':'Junk',
		};
		
		new M.item({
			name:'testSword',nameD:'Test sword',
			icon:[0,1],
			type:'weapon',
		});
		new M.item({
			name:'testRing',nameD:'Test ring',
			icon:[1,0],
			type:'acc',
		});
		new M.item({
			name:'testHat',nameD:'Test hat',
			icon:[1,1],
			type:'armor',
		});
		new M.item({
			name:'testHat2',nameD:'Test hat 2',
			icon:[1.1,1.1],
			type:'armor',
		});
		new M.item({
			name:'testCons',nameD:'Test consumable',
			icon:[0,0],
			type:'stat',
		});
		new M.item({
			name:'starterSword',nameD:'Starter sword',
			desc:"<b>Tip :</b> to equip an item, click it in your inventory, then click your hero's gear slot.<q>A sword so didactic it teaches you how to use it.</q>",
			icon:[0,1],
			type:'weapon',
			stats:{mgt:1},
		});
		
		//TODO : .slot should be more versatile, ie. inventory, hero accessory, ground etc
		M.itemInst=function(type,n)
		{
			this.type=type;
			this.n=n;
			this.slot=0;
		}
		M.itemInst.prototype.slotIn=function(slot)
		{
			if (this.slot) {this.slot.item=0;this.slot.refresh();this.slot=0;}
			var prevItem=slot.item;
			if (prevItem)
			{
				M.startDragging(prevItem);
			}
			this.slot=slot;
			slot.item=this;
			slot.refresh();
			triggerAnim(slot.l,'puckerHalf');
			//todo : handle slot.accept
		}
		M.getItem=function(item,n)
		{
			//gain an item and put it in the inventory (return the item, or false if inventory full)
			//item can be an item instance, an item type, or the name of an item type
			var n=n||1;
			if (typeof item==='string') item=new M.itemInst(M.itemsBN[item],n);
			else if (item.constructor==M.itemInst) {}
			else item=new M.itemInst(M.itemsBN[item],n);
			
			var slot=0;
			for (var i=0;i<M.invM;i++)
			{
				var current=M.inv[i].item;
				if (!current || (current.type.stackN>0 && (item.n+current.n)<=current.type.stackN)){slot=M.inv[i];break;}
			}
			if (!slot){return false;}
			item.slotIn(slot);
			//console.log('put ',item,' in ',slot);
			return item;
		}
		
		M.invM=14;
		M.inv=[];
		M.initInv=function()
		{
			//init inventory
			var str='';
			for (var i=0;i<M.invM;i++)
			{
				M.inv[i]=new M.slot();
				str+=M.inv[i].write('dungeonInvSlot-'+i);
			}
			l('dungeonInv').innerHTML=str;
			
			for (var i=0;i<M.invM;i++)
			{
				M.inv[i].bind();
			}
			
			M.getItem('starterSword');
			M.getItem('testSword');
			M.getItem('testRing');
			M.getItem('testCons');
			M.getItem('testCons');
			M.getItem('testHat2');
			var it=M.getItem('testHat');
			M.heroEquip(0,it);
		}
		
		
		//maps
		M.map=M.Maker('maps',function(me){
			me.locs=[];
			me.links=[];
		});
		
		new M.map({name:'factory',pic:Game.resPath+'img/dungeonMapFactory.jpg',w:100,h:400});
		new M.map({name:'world',pic:Game.resPath+'img/dungeonMapWorld.jpg',w:500,h:500});
		
		
		//locs
		M.loc=M.Maker('locs',function(me){
			me.parents=[];
			me.children=[];
			me.links=[];
			me.linksO=[];
			me.visited=false;
			me.l=0;
			me.foes=[];
			me.features=[];
		},function(me){
			me.map=M.mapsBN[me.map];
			me.map.locs.push(me);
			me.nameD=me.nameD||me.name;
		});
		M.link=M.Maker('links',function(me){
			me.start=0;
			me.end=0;
			me.name='link'+M.links.length;
			me.l=0;
			me.d=1;//distance
			me.foes=[];
		},function(me){
			me.map=M.mapsBN[me.map];
			me.map.links.push(me);
		},{noPrev:true});
		M.loc.prototype.link=function(to,o)
		{
			if (to==this || M.isLinked(this,to)) return this;
			if (typeof to==='string') to=M.locsBN[to];
			this.parents.push(to);
			to.children.push(this);
			this.links.push(to);to.links.push(this);
			var link=new M.link(o||{});
			link.start=this;
			link.end=to;
			
			var loc1=link.start;
			var loc2=link.end;
			var origX=origX=(loc2.x);
			var origY=origY=(loc2.y);
			var targX=(loc1.x);
			var targY=(loc1.y);
			var dist=(Math.sqrt((targX-origX)*(targX-origX)+(targY-origY)*(targY-origY)));
			link.d=dist;
			//if (!link.nameD) link.nameD=link.start.nameD+' - '+link.end.nameD;
			if (!link.nameD) link.nameD='path';
			
			this.linksO.push(link);to.linksO.push(link);
			return this;
		}
		M.loc.prototype.isVisited=function()
		{
			if (Game.Has('A really good guide book')) return true;
			else return this.visited;
		}
		M.isLinked=function(loc,locB)
		{
			for (var ii in loc.links)
			{
				var loc2=loc.links[ii];
				if (loc2==locB) return true;
			}
			return false;
		}
		M.locTooltip=function(id)
		{
			return function()
			{
				var me=M.locs[id];
				var str='Click to travel to this location.';
				if (me==M.onLoc) str='You are here!';
				var tags=[];
				if (me.visited) tags.push('Explored'); else if (Game.Has('A really good guide book')) tags.push('Visible thanks to guide book'); else tags.push('Unexplored');
				if (tags.length>0) str='<div style="font-variant:small-caps;font-size:85%;opacity:0.75;margin-bottom:8px;">['+tags.join('] [')+']</div>'+str;
				return '<div class="prompt" style="width:250px;text-align:center;"><h3 style="margin:4px 32px;">'+me.nameD+'</h3><div class="block">'+str+'</div></div>';
			}
		}
		M.linkTooltip=function(id)
		{
			return function()
			{
				var me=M.links[id];
				var loc1=me.start;
				var loc2=me.end;
				var str='Nothing to report here.';
				str+='<br><br><b>Monster level :</b> ???';
				return '<div class="prompt" style="width:250px;text-align:center;"><h4 style="margin:4px 32px;">'+me.nameD+'</h4><div class="block">'+str+'</div></div>';
				//return '<div class="prompt" style="width:250px;text-align:center;"><h3 style="margin:4px 32px;">'+me.nameD+'</h3><div class="block">'+str+'</div></div>';
			}
		}
		M.loc.prototype.feature=function(props)
		{
			this.features.push(props);
			return this;
		}
		
		M.updateLocStyles=function()
		{
			//set links green and locs golden depending on current path and location
			if (!M.onLoc) return false;
			
			var path=(M.path||[]).concat([M.onLoc,M.toLoc]);
			
			//console.log('path :',grabProps(path,'name').join(', '));
			for (var i in M.onMap.links)
			{
				var link=M.onMap.links[i];
				var el=l('dungeonLocLink'+link.id);
				el.classList.remove('dungeonOn');
				
				if ((link.start==M.onLoc && link.end==M.toLoc) || (link.end==M.onLoc && link.start==M.toLoc)) el.classList.add('dungeonOn');
				else
				{
					var startIn=false;
					var endIn=false;
					if (path.includes(link.start)) startIn=true;
					if (path.includes(link.end)) endIn=true;
					
					if (startIn && endIn) {el.classList.add('dungeonLinked');}
					else el.classList.remove('dungeonLinked');
				}
				
				if (link.start.isVisited() || link.end.isVisited()) el.classList.add('dungeonVisible'); else el.classList.remove('dungeonVisible');
			}
			for (var i in M.onMap.locs)
			{
				var loc=M.onMap.locs[i];
				var el=l('dungeonLoc'+loc.id);
				el.classList.remove('dungeonOn');
				
				var visible=false;
				if (loc.isVisited()) visible=true;
				else
				{
					for (var ii in loc.links){if (loc.links[ii].isVisited()){visible=true;break;}}
				}
				if (visible) el.classList.add('dungeonVisible'); else el.classList.remove('dungeonVisible');
				if (loc.isVisited()) el.classList.add('dungeonVisited'); else el.classList.remove('dungeonVisited');
				
				if (path.includes(loc)) el.classList.add('dungeonLinked');
				else el.classList.remove('dungeonLinked');
			}
			
			if (!M.toLoc) l('dungeonLoc'+M.onLoc.id).classList.add('dungeonOn');
			
			if (M.onLink) l('dungeonFeatures').style.display='none';
			else
			{
				var str='';
				var callbacks=[];
				for (var i=0;i<M.onLoc.features.length;i++)
				{
					var it=M.onLoc.features[i];
					var callback={i:i};
					if (it[0]=='rest')
					{
						callback.button=it[1]||'Rest';
						callback.tip="Rest until you recover your health.";
						callback.click=function(it){return function(e){
							for (var i=0;i<M.team.length;i++){M.team[i].hp=M.team[i].hpm;}
							M.updateTeamStatus();
							triggerAnim(e.target,'pucker');
							if (it[2]) M.log(M.c(it[2]),'lore');
							var hero=M.randomHero();hero.say('rest');
							if (Math.random()<0.5) M.randomHeroNot(hero).say('rest');
						};}(it);
					}
					else if (it[0]=='item')
					{
					}
					
					if (callback.button){str+='<div class="dungeonButton" id="dungeonFeature-'+i+'">'+callback.button+'</div>';}
					callbacks.push(callback);
					//.feature(['rest','Rest',"You take a nap in one of the comfortable recliners in the lobby, knowing the monsters aren't too bad here."])
					//.feature(['item','starterSword',function(){return !M.own('starterSword');}]);
				}
				if (str=='') {l('dungeonFeatures').style.display='none';l('dungeonFeatures').innerHTML='';}
				else
				{
					l('dungeonFeatures').innerHTML=str;
					l('dungeonFeatures').style.display='block';
					for (var i=0;i<callbacks.length;i++)
					{
						var it=callbacks[i];
						var id=it.i;
						if (it.click) AddEvent(l('dungeonFeature-'+id),'click',it.click);
						if (it.tip) Game.attachTooltip(l('dungeonFeature-'+id),typeof it.tip==='string'?('<div class="prompt" style="width:250px;text-align:center;padding:8px;">'+it.tip+'</div>'):it.tip,'this');
					}
				}
				triggerAnim(l('dungeonFeatures'),'pucker');
			}
			
			if (M.onLink) l('dungeonLocTitle').innerHTML=M.onLink.nameD;
			else l('dungeonLocTitle').innerHTML=M.lastLoc.nameD;
			triggerAnim(l('dungeonLocTitle'),'pucker');
		}
		
		/*
			how .foes lists work :
				-[{encounter1},{encounter2},{encounter3}]
					each battle picks an encounter at random
				-{'enemy1':3}
					this encounter spawns 3 of enemy1
				-{'enemy1':1,'enemy2':4}
					this encounter spawns 1 of enemy1, and 4 of enemy2
				-{'enemy1':3,r:0.2}
					this encounter spawns 3 of enemy1 and has a rarity of 20% (making it much less common; baseline is r:1)
				-{'enemy1':[0,3]}
					this encounter spawns between 0 and 3 of enemy1
		*/
		
		M.Glob={map:'factory'};
			new M.loc({name:'lobby',nameD:'Lobby',x:32,y:20,discover:function(){M.log('You find yourself in the entrance of a strange cookie factory.<br>Failed batches, broken machines and underpaid employees pace through the halls of this place.<br>There is much to be done...','lore');}})
				.feature(['rest','Rest',"It feels fairly safe in the lobby. You read a magazine and take a nap in one of the comfortable recliners."])
				.feature(['item','starterSword',function(){return !M.own('starterSword');}]);
			new M.loc({name:'free samples',nameD:'Lvl.1: Free samples',x:69,y:28})
				//cookie dispenser : you can take one if you don't own any; restores 10hp
				.link(M.prev,{nameD:'Hallway',foes:[{'baby sentient cookie':[1,2]}]});
			new M.loc({name:'packing',nameD:'Lvl.2: Packing',x:44,y:49})
				//store : sells cardboard gear
				.link(M.prev,{nameD:'Corridor',foes:[{'baby sentient cookie':[1,3]},{'angry sentient cookie':1,'baby sentient cookie':[0,2],}]});
			new M.loc({name:'quality control',nameD:'Lvl.3: Quality control',x:38,y:84})
				//pick up a wrench for 25 gold
				//note : "When you find new items but your inventory is full, they will drop to the ground instead. Items on the ground will start disappearing if there are too many, or if you change maps."
				.link(M.prev,{nameD:'Corridor'});
			new M.loc({name:'research portals',nameD:'Lvl.4: Research - Portals',x:52,y:110})
				//boss : lone portaloid - when defeated, it tells you some lore and drops the warped prototype, a quest item that only becomes useful later
				//you can find the warped prototype here again if you dropped it somewhere else
				.link(M.prev,{nameD:'Corridor'});
			//new loc : break room
				//coffee machine : restores 3 hp to everyone for 3 gold
				//gold redemption machine : turns your useless gold into cookies (1 gold per cookie) (opens a popup with a text entry field) (you can also upgrade the machine to give x10 cookies per gold; maybe repeatable, with increasing cost) ("This upgrade affects all cookie redemption everywhere, forever.")
				//note : "Combat basics - (explanation of stats etc; perhaps one note per stat)"
			new M.loc({name:'baketopia portal',nameD:'Portal to Baketopia',x:25,y:108})
				.link(M.prev,{nameD:'High-security corridor'});
				//TODO : path to portal should be forbidden until the building is level 2
			//new loc : pocket universe
				//a different map
				//"this universe still seems unstable, maybe you should turn back..."
			//new loc : a shifting abyss
				//actually 3 consecutive locs made of tougher and tougher mobs; reaching each unlocks a new hero, though they warn you they're not here to stay
		
		
		/*for (var i=0;i<10;i++)
		{
			new M.loc({name:'???'+Math.random(),x:Math.random()*100,y:Math.random()*100});
			M.last.link(choose(M.locs));
			if (M.last.links.length==0) M.last.link(M.prev);
			if (Math.random()<0.2) M.last.link(choose(M.locs));
			if (Math.random()<0.2) M.last.link(choose(M.locs));
		}*/
		
		//TODO : a link may have a monster list, a combat amount, and 2 connecting locs
		
		
		M.Glob={};
		
		
		
		M.onMap=0;//which map we're on
		M.onLoc=0;//which location we're on or walking away from
		M.lastLoc=0;//which location we last really visited
		M.onLink=0;//which link we're on
		M.homeLoc=0;//where we go back to when we lose a battle
		
		M.toLoc=0;//loc we're headed to
		M.toLocR=0;//how far along the journey are we between M.onLoc and M.toLoc (0-1)
		M.afterCombatGoTo=0;//when we click a loc while in combat, go there after combat ends
		
		M.gotoMap=function(map)
		{
			if (typeof map==='string') map=M.mapsBN[map];
			if (map==M.onMap) return false;
			
			M.onMap=map;
			M.mapBG.style.background='url('+map.pic+')';
			M.mapBG.style.width=map.w+'px';
			M.mapBG.style.height=map.h+'px';
			
			var str='';
			for (var i in map.links)
			{
				var link=map.links[i];
				var loc=link.start;
				var loc2=link.end;
				var origX=origX=(loc2.x*5);
				var origY=origY=(loc2.y*5);
				var targX=(loc.x*5);
				var targY=(loc.y*5);
				
				var rot=-(Math.atan((targY-origY)/(origX-targX))/Math.PI)*180;
				if (targX<=origX) rot+=180;
				var dist=Math.floor(Math.sqrt((targX-origX)*(targX-origX)+(targY-origY)*(targY-origY)));
				str+='<div class="dungeonLocLink" id="dungeonLocLink'+link.id+'" style="width:'+dist+'px;-webkit-transform:rotate('+rot+'deg);-moz-transform:rotate('+rot+'deg);-ms-transform:rotate('+rot+'deg);-o-transform:rotate('+rot+'deg);transform:rotate('+rot+'deg);left:'+(origX)+'px;top:'+(origY)+'px;" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.linkTooltip('+link.id+')')+'></div>';
			}
			for (var i in map.locs)
			{
				var loc=map.locs[i];
				str+='<div class="dungeonLoc" id="dungeonLoc'+loc.id+'" style="left:'+(loc.x*5)+'px;top:'+(loc.y*5)+'px;" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.locTooltip('+loc.id+')','this')+'></div>';
			}
			for (var i=0;i<4;i++)
			{
				str+='<div class="dungeonSprite" id="dungeonSpriteHero-'+i+'"></div>';
			}
			M.mapOverL.innerHTML=str;
			
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				if (me.hero)
				{
					l('dungeonSpriteHero-'+i).style.backgroundPosition=(-me.hero.sprite[0]*16)+'px '+(-me.hero.sprite[1]*16)+'px';
					l('dungeonSpriteHero-'+i).style.zIndex=100-i;
					me.sprite=l('dungeonSpriteHero-'+i);
				}
			}
			
			for (var i in map.locs)
			{
				var loc=map.locs[i];
				loc.l=l('dungeonLoc'+loc.id);
				AddEvent(loc.l,'click',function(loc){return function(){
					if (Game.Has('A really good guide book') && Game.keys[17]) M.setLoc(loc);
					else M.gotoLoc(loc);
					Game.tooltip.hide();
					triggerAnim(this,'pucker');
				}}(loc));
			}
			for (var i in map.links)
			{
				var link=map.links[i];
				link.l=l('dungeonLocLink'+link.id);
				AddEvent(link.l,'click',function(link){return function(){M.clickLink(link);Game.tooltip.hide();}}(link));
			}
		}
		M.path=[];//nodes we still need to traverse to reach our destination
		
		//source for the pathfinding : https://github.com/mburst/dijkstras-algorithm/blob/master/dijkstras.js
		//i initially tried writing my own implementation. this was not meant to be
		let PriorityQueue=function()
		{
			this._nodes = [];

			this.enqueue = function (priority, key) {
				this._nodes.push({key: key, priority: priority });
				this.sort();
			};
			this.dequeue = function () {
				return this._nodes.shift().key;
			};
			this.sort = function () {
				this._nodes.sort(function (a, b) {
					return a.priority - b.priority;
				});
			};
			this.isEmpty = function () {
				return !this._nodes.length;
			};
		}
		
		let Graph=function()
		{
			var INFINITY = 1/0;
			this.vertices = {};

			this.addVertex = function(name, edges){
				this.vertices[name] = edges;
			};

			this.shortestPath = function (start, finish) {
				var nodes = new PriorityQueue(),
				distances = {},
				previous = {},
				path = [],
				smallest, vertex, neighbor, alt;

				for(vertex in this.vertices) {
					if(vertex === start) {
						distances[vertex] = 0;
						nodes.enqueue(0, vertex);
					}
					else {
						distances[vertex] = INFINITY;
						nodes.enqueue(INFINITY, vertex);
					}

					previous[vertex] = null;
				}

				while(!nodes.isEmpty()) {
					smallest = nodes.dequeue();

					if(smallest === finish) {
						path = [];

						while(previous[smallest]) {
							path.push(smallest);
							smallest = previous[smallest];
						}

						break;
					}

					if(!smallest || distances[smallest] === INFINITY){
						continue;
					}

					for(neighbor in this.vertices[smallest]) {
						alt = distances[smallest] + this.vertices[smallest][neighbor];

						if(alt < distances[neighbor]) {
							distances[neighbor] = alt;
							previous[neighbor] = smallest;

							nodes.enqueue(alt, neighbor);
						}
					}
				}

				return path;
			};
		}
		
		M.getShortestPathBetween=function(loc1,loc2)
		{
			if (!loc1 || !loc2 || loc1.map!=loc2.map) return false;
			
			var g=new Graph();

			for (var i in M.onMap.locs)
			{
				var loc=M.onMap.locs[i];
				var links={};
				for (var ii=0;ii<loc.linksO.length;ii++)
				{
					var link=loc.linksO[ii];
					var name=link.end.name;
					if (link.end==loc) name=link.start.name;
					links[name]=link.d;
				}
				g.addVertex(loc.name,links);
			}
			
			var path=g.shortestPath(loc1.name,loc2.name).reverse();
			for (var i in path) path[i]=M.locsBN[path[i]];
			return path;
		}
		M.gotoLoc=function(loc,step)
		{
			if (M.inCombat) {M.afterCombatGoTo=loc;return false;}
			//"step" is true if we're just going to a node as part of a bigger path, as opposed to charting a new path
			if (typeof loc==='string') loc=M.locsBN[loc];
			if (loc==M.onLoc && !M.toLoc) return false;
			
			var prevToLoc=M.toLoc;
			
			var goingBack=false;
			if (!step && M.onLoc==loc && prevToLoc!=loc && M.isLinked(loc,prevToLoc))
			{
				goingBack=true;
			}
			M.toLoc=loc;
			if (!M.onLoc) M.toLocR=1;
			
			if (M.toLoc)
			{
				M.gotoMap(M.toLoc.map);
				//if (step) M.centerLoc(M.toLoc);
			}
			
			if (!step && M.onLoc && M.toLoc)
			{
				if (Math.random()<0.3) M.randomHero().say('go');
				M.path=M.getShortestPathBetween(M.onLoc,M.toLoc);
				if (goingBack || (prevToLoc && M.path && M.path.length>0 && !M.path.includes(prevToLoc)))
				{
					M.toLocR=1-M.toLocR;
					M.toLoc=M.onLoc;
					M.onLoc=prevToLoc;
					M.path.unshift(M.toLoc);
				}
				else if (M.path && !M.path.includes(prevToLoc)) M.toLocR=0;
				if (M.path.length>0)
				{
					M.gotoLoc(M.path[0],true);M.path.shift();
				}
			}
			
			M.toLink=0;
			if (M.toLoc)
			{
				for (var i in M.onLoc.linksO)
				{
					var link=M.onLoc.linksO[i];
					if (link.start==M.toLoc || link.end==M.toLoc) {M.onLink=link;}
				}
			}
			
			M.updateLocStyles();
		}
		M.arriveAtLoc=function(loc)
		{
			if (typeof loc==='string') loc=M.locsBN[loc];
			M.onLoc=loc;
			if (!M.onLoc.visited)
			{
				M.onLoc.visited=true;
				if (M.onLoc.discover) M.onLoc.discover();
				M.computeMapBounds();
				
				var n=0;
				for (var i in M.onLoc.links)
				{
					if (!M.onLoc.links[i].visited)
					{
						setTimeout(function(me){return function(){
							if (me.l) Game.SparkleOn(me.l);
						}}(M.onLoc.links[i]),n*150);
						n++;
					}
				}
			}
			M.lastLoc=M.onLoc;
			M.onLink=0;
			M.updateLocStyles();
		}
		M.setLoc=function(loc)
		{
			if (typeof loc==='string') loc=M.locsBN[loc];
			M.toLoc=0;
			M.toLocR=0;
			M.afterCombatGoTo=0;
			M.gotoMap(loc.map);
			M.arriveAtLoc(loc);
		}
		M.moveLogic=function()
		{
			if (M.toLoc)
			{
				var dist=M.onLink?(M.onLink.d/30):1;
				M.toLocR+=1/(Game.fps*dist);
				
				if (M.toLocR>=1)//journey complete
				{
					var loc=M.toLoc;
					M.toLocR=0;
					M.toLoc=0;
					M.arriveAtLoc(loc);
					if (M.path.length>0)
					{
						M.gotoLoc(M.path[0],true);M.path.shift();
					}
				}
				else
				{
					M.combatTest();
				}
			}
		}
		
		M.clickLink=function(link)
		{
			if (link.start==M.onLoc) M.gotoLoc(link.end);
			else if (link.end==M.onLoc) M.gotoLoc(link.start);
		}
		M.centerLoc=function(loc)
		{
			if (!loc) var loc=M.toLoc||M.onLoc;
			M.mapOffXT=-loc.x*5;
			M.mapOffYT=-loc.y*5;
		}
		M.centerPoint=function(x,y)
		{
			M.mapOffXT=-x*5;
			M.mapOffYT=-y*5;
		}
		
		
		M.lastCombat=0;//ticks since last battle
		M.inCombat=false;
		M.inCombatWith=[];//list of foes we're currently facing ({type,hp,effects})
		M.combatStatus=0;//0 : in progress, 1 : victory, -1 : defeat
		
		M.combat=function(foes)
		{
			//enter combat
			M.lastCombat=0;
			M.inCombat=true;
			M.combatStatus=0;
			M.l.classList.add('dungeonInCombat');
			var str='';
			
			for (var i=0;i<foes.length;i++)
			{
				var foe=M.foesBN[foes[i]];
				var hp=10;//todo
				var moveT=Math.floor(10+Math.random()*10);//todo
				M.inCombatWith.push({type:foe,hp:hp,hpm:hp,t:moveT,eff:[],l:null,hpl:null,picl:null});
				var pic=foe.pic;
				str+='<div class="dungeonFoe" id="dungeonFoe-'+i+'"><div id="dungeonFoePic-'+i+'" class="dungeonFoePic shadowFilter" style="background-position:'+(-pic[0]*16)+'px '+(-pic[1]*16)+'px;"></div>'+foe.name+'<div class="dungeonHPwrap"><div id="dungeonFoeHP-'+i+'" class="dungeonHP"></div></div></div>';
			}
			l('dungeonCombat').innerHTML='<div id="dungeonBattleHeader">Battle!</div>'+str;
			triggerAnim(l('dungeonCombat'),'pucker');
			for (var i=0;i<M.inCombatWith.length;i++)
			{
				var foe=M.inCombatWith[i];
				foe.l=l('dungeonFoe-'+i);
				foe.hpl=l('dungeonFoeHP-'+i);
				foe.picl=l('dungeonFoePic-'+i);
				foe.hpl.style.width='0%';
			}
			
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				/*me.l.classList.remove('dungeonDead');
				me.hpm=10;//todo
				me.hp=me.hpm;
				me.hpl.style.width='0%';*/
				M.heroComputeStats(me);
				me.t=Math.floor(10+Math.random()*10);//todo
			}
			//setTimeout(M.endCombat,1000);
		}
		M.endCombat=function()
		{
			M.inCombatWith=[];
			M.inCombat=false;
			M.lastCombat=0;
			M.l.classList.remove('dungeonInCombat');
			l('dungeonCombat').innerHTML='';
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				M.heroComputeStats(me);
			}
			if (M.afterCombatGoTo) {M.gotoLoc(M.afterCombatGoTo);M.afterCombatGoTo=0;};
		}
		M.combatTest=function()
		{
			//test if we should encounter something right now; if yes, trigger battle
			var loc=M.onLoc;
			if (M.onLink) loc=M.onLink;
			if (loc.foes.length>0)
			{
				M.lastCombat++;
				if (M.lastCombat>=10 && Math.random()<0.1)
				{
					var encounters=[];
					for (var i=0;i<loc.foes.length;i++)
					{
						var it=loc.foes[i];
						if (typeof it.r==='undefined' || Math.random()<it.r) encounters.push(it);
					}
					if (encounters.length>0)
					{
						var foes=[];
						var encounter=choose(encounters);
						for (var i in encounter)
						{
							if (i=='r') continue;
							var amount=encounter[i];
							if (Array.isArray(amount)) amount=Math.round(Math.random()*(amount[1]-amount[0])+amount[0]);
							for (var ii=0;ii<amount;ii++){foes.push(i);}
						}
						if (foes.length>0)
						{
							M.combat(foes);
						}
					}
				}
			}
		}
		M.combatLogic=function()
		{
			var targets=[];
			for (var i=0;i<M.inCombatWith.length;i++){if (M.inCombatWith[i].hp>0) targets.push(M.inCombatWith[i]);}
			var heroTargets=[];
			for (var i=0;i<M.team.length;i++){if (M.team[i].hp>0) heroTargets.push(M.team[i]);}
			
			var heroesAlive=0;
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				if (!me.hero) continue;
				M.heroComputeStats(me);
				if (me.hp<=0) me.l.classList.add('dungeonDead');
				else me.l.classList.remove('dungeonDead');
				me.hpl.style.width=Math.ceil(Math.max(me.hp/me.hpm,0)*100)+'%';
				if (me.hp<=0) continue;
				if (me.t>0) me.t--;
				else if (targets.length>0)
				{
					var target=choose(targets);
					var dmg=Math.floor(Math.random()*5+1);
					target.hp-=dmg;
					triggerAnim(me.picl,'punchDown');
					triggerAnim(target.l,'flashRed');
					me.t=20;
				}
				if (me.hp>0) heroesAlive++;
			}
			var foesAlive=0;
			for (var i=0;i<M.inCombatWith.length;i++)
			{
				var me=M.inCombatWith[i];
				if (me.hp<=0) me.l.classList.add('dungeonDead');
				else me.l.classList.remove('dungeonDead');
				me.hpl.style.width=Math.ceil(Math.max(me.hp/me.hpm,0)*100)+'%';
				if (me.hp<=0) continue;
				if (me.t>0) me.t--;
				else if (heroTargets.length>0)
				{
					var target=choose(heroTargets);
					var dmg=Math.floor(Math.random()*2+1);
					target.hp-=dmg;
					triggerAnim(me.picl,'punchUp');
					triggerAnim(target.l,'flashRed');
					me.t=20;
				}
				if (me.hp>0) foesAlive++;
			}
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				if (!me.hero) continue;
				me.hp=Math.floor(Math.max(0,me.hp));
			}
			if (heroesAlive==0 && M.combatStatus==0)
			{
				M.combatStatus=-1;
			}
			if (foesAlive==0 && M.combatStatus==0)
			{
				M.combatStatus=1;
			}
			if (M.combatStatus!=0)
			{
				if (M.combatStatus==1)
				{
					//victory; gain xp and items from foes
					var xp=0;
					for (var i=0;i<M.inCombatWith.length;i++)
					{
						var me=M.inCombatWith[i];
						var myXp=me.type.lvl;
						if (me.type.lvl<M.lvl) myXp-=(M.lvl-me.type.lvl);
						xp+=Math.max(1,myXp);
					}
					M.gainXP(xp);
					//todo : items, gold
				}
				else
				{
					//defeat
				}
				
				M.endCombat();
				
				if (M.combatStatus==1)
				{
					//victory
				}
				else if (M.combatStatus==-1)
				{
					//defeat; give everyone some HP back and teleport back to home
					for (var i=0;i<M.team.length;i++)
					{
						var me=M.team[i];
						if (!me.hero) continue;
						me.hp=Math.ceil(me.hpm/2);
						
						me.hpl.style.transition='none';
						void me.hpl.offsetHeight;
						me.hpl.style.transition='';
					}
					
					M.burst('<div style="color:#f00;text-shadow:0px 0px 4px #000,0px 0px 16px #f00;">You died</div>');
					M.log('<b>You died.</b>','black redText');
					var hero=M.randomHero();hero.say('die');
					if (Math.random()<0.3) M.randomHeroNot(hero).say('die');
					M.updateTeamStatus();
					M.setLoc(M.homeLoc);
					M.centerLoc();
				}
			}
		}
		M.updateTeamStatus=function()
		{
			for (var i=0;i<M.team.length;i++)
			{
				var me=M.team[i];
				if (!me.hero) continue;
				if (me.hp<=0) me.l.classList.add('dungeonDead');
				else me.l.classList.remove('dungeonDead');
				me.hpl.style.width=Math.ceil(Math.max(me.hp/me.hpm,0)*100)+'%';
			}
		}
		
		M.mapClicked=false;
		M.mapDragging=false;
		M.mapDragX=0;
		M.mapDragY=0;
		M.mapOffX=0;
		M.mapOffXT=0;
		M.mapOffY=0;
		M.mapOffYT=0;
		M.mapBounds=[0,0,0,0];
		M.computeMapBounds=function()
		{
			var left=0;
			var right=0;
			var top=0;
			var bottom=0;
			var n=0;
			for (var i=0;i<M.onMap.locs.length;i++)
			{
				var it=M.onMap.locs[i];
				var visible=false;
				if (it.isVisited()) visible=true;
				else {for (var ii in it.links){if (it.links[ii].isVisited()){visible=true;break;}}}
				if (visible)
				{
					if (n==0)
					{
						left=it.x;right=it.x;top=it.y;bottom=it.y;
					}
					else
					{
						left=Math.min(left,it.x);
						right=Math.max(right,it.x);
						top=Math.min(top,it.y);
						bottom=Math.max(bottom,it.y);
					}
					n++;
				}
			}
			var margin=32;
			M.mapBounds[0]=left*5-margin;
			M.mapBounds[1]=right*5+margin;
			M.mapBounds[2]=top*5-margin;
			M.mapBounds[3]=bottom*5+margin;
		}
		M.mapControl=function()
		{
			if (M.mapClicked && !Game.promptOn)
			{
				if (!M.mapDragging)
				{
					M.mapDragX=Game.mouseX;
					M.mapDragY=Game.mouseY;
				}
				M.mapDragging=true;
				
				M.mapOffXT+=(Game.mouseX-M.mapDragX);
				M.mapOffYT+=(Game.mouseY-M.mapDragY);
				M.mapDragX=Game.mouseX;
				M.mapDragY=Game.mouseY;
			}
			else M.mapDragging=false;
			
			//bounds
			M.mapOffXT=Math.max(-M.mapBounds[1],Math.min(-M.mapBounds[0],M.mapOffXT));
			M.mapOffYT=Math.max(-M.mapBounds[3],Math.min(-M.mapBounds[2],M.mapOffYT));
			
			M.mapOffX+=(M.mapOffXT-M.mapOffX)*0.5;
			M.mapOffY+=(M.mapOffYT-M.mapOffY)*0.5;
			
			var bounds=M.bounds;
			var mX=(Game.mouseX-bounds.left)/5;
			var mY=(Game.mouseY-bounds.top)/5+6;
			/*l('dungeonDebug').innerHTML=
			'onLoc:'+M.onLoc.name+
			'<br>toLoc:'+M.toLoc.name+
			'<br>onLink:'+M.onLink.name+
			'<br>'+mX+','+mY+','+(M.toLoc?M.toLoc.name:'')+','+M.toLocR;*/
			
			if (!Game.mouseDown) M.mapClicked=false;
		}
		
		
		var str='';
		str+='<style>'+
		'#dungeonBG{background:#000;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}'+
		'#dungeonContent{position:relative;box-sizing:border-box;padding:4px 24px;height:520px;overflow:hidden;color:#fff;text-shadow:0px 1px 0px #000;font-variant:small-caps;font-family:Georgia,serif;}'+
			'#dungeonOverlay{position:absolute;left:0px;top:0px;right:0px;bottom:0px;z-index:100;background:url('+Game.resPath+'img/shadedBordersSoft.png);background-size:100% 100%;pointer-events:none;}'+
				'#dungeonBurst{position:absolute;top:0px;left:0px;right:0px;bottom:0px;font-size:36px;font-weight:bold;}'+
				'.dungeonBurst{transform:translate(-50%,50%);padding:8px;width:100%;text-align:center;background:rgba(0,0,0,0.75);position:absolute;top:50%;left:50%;animation:dungeonBurstAnim 2.5s ease-out;animation-fill-mode:forwards;margin-top:-64px;}'+
				'@keyframes dungeonBurstAnim{0%{margin-top:64px;opacity:0;}25%{margin-top:-48px;opacity:1;}80%{margin-top:-64px;opacity:1;}100%{opacity:0;}}'+
				
			'#dungeonMap{position:absolute;left:0px;top:0px;transform:translate(0px,0px);z-index:10;}'+
			'#dungeonMapBG{position:absolute;left:0px;top:0px;transform-origin:0px 0px;transform:scale(5);z-index:10;}'+
			'#dungeonMapOver{position:absolute;left:0px;top:0px;z-index:20;}'+
			'.dungeonSprite{position:absolute;width:16px;height:16px;background:url('+Game.resPath+'img/dungeonFoes.png) 0px 0px;margin-left:-8px;margin-top:-8px;pointer-events:none;}'+
			'.dungeonLoc{display:none;position:absolute;width:32px;height:32px;background:url('+Game.resPath+'img/dungeonDot.png) -128px 0px;margin-left:-16px;margin-top:-16px;cursor:pointer;}'+
				'.dungeonLoc:hover{background-position:-64px 0px;}'+
				'.dungeonLoc.dungeonVisited{background-position:-64px 0px;}'+
				'.dungeonLoc.dungeonVisited.dungeonLinked,.dungeonLoc.dungeonVisited:hover{background-position:0px 0px;}'+
				'.dungeonLoc.dungeonVisited.dungeonLinked:hover{background-position:-32px 0px;}'+
				'.dungeonLoc.dungeonOn,.dungeonLoc.dungeonOn:hover{background-position:-96px 0px;}'+
			'.dungeonLocLink{display:none;background:url('+Game.resPath+'img/linkDash.png) 0px -12px;width:0px;height:6px;position:absolute;-ms-transform-origin:0% 50%;-webkit-transform-origin:0% 50%;transform-origin:0% 50%;opacity:0.75;z-index:-10;background-clip:content-box;cursor:pointer;}'+
				'.dungeonLocLink{border:12px solid rgba(0,0,0,0);border-left:none;border-right:none;margin:-12px 0px;}'+
				'.dungeonLocLink.dungeonLinked{background-position:0px -6px;}'+
				'.dungeonLocLink.dungeonLinked:hover,.dungeonLocLink.dungeonOn{background-position:0px 0px;}'+
			
			'.dungeonVisible{display:block;}'+
			'.dungeonInset{text-align:center;background:rgba(0,0,0,0.2);box-shadow:0px 0px 6px rgba(105,78,61,0.5),2px 2px 4px rgba(0,0,0,0.2) inset;padding:4px;margin:2px 8px;border-radius:4px;}'+
			'.dungeonSlotset{line-height:0px;}'+
			'.dungeonLine{border-top:1px solid rgba(0,0,0,0.75);border-bottom:1px solid rgba(105,78,61,0.75);margin:4px -4px;}'+
			'#dungeonSide{text-align:center;position:absolute;padding:8px 4px;background:url('+Game.resPath+'img/brownStripesLeftEdge.png),url('+Game.resPath+'img/brownStripes.png);background-repeat:repeat-y,repeat;top:0px;bottom:0px;right:0px;width:192px;z-index:100;padding-bottom:128px;}'+
			
			'#dungeonLog{text-align:left;height:128px;overflow-x:hidden;overflow-y:scroll;position:absolute;bottom:0px;left:0px;right:0px;padding:2px 8px;background:#fff;color:rgba(0,0,0,0.9);text-shadow:none;font-size:9px;font-family:Verdana;font-variant:normal;z-index:100;transition:height 0.2s;}'+
			'#dungeonLog:hover{height:95%;}'+
			'#dungeonLog b{font-weight:bold;}'+
			'.dungeonLogMessage{overflow:hidden;margin-bottom:-2px;}'+
			'.dungeonLogMessagePic{vertical-align:middle;margin-right:4px;}'+
			'.dungeonLogMessageBody{vertical-align:middle;padding-bottom:2px;}'+
				'.dungeonLogMessage-black{background:#000;text-align:center;color:#fff;margin:1px -8px;padding:2px;}'+
				'.dungeonLogMessage-redText{color:#f00;}'+
				'.dungeonLogMessage-lore{color:rgba(0,0,0,0.7);font-style:italic;padding:1px 0px;margin:2px 0px;border-top:1px solid rgba(0,0,0,0.2);border-bottom:1px solid rgba(0,0,0,0.2);text-indent:6px;}'+
			'.dungeonHero{border-radius:4px;position:relative;width:50%;height:56px;display:inline-block;text-align:left;text-indent:4px;overflow:hidden;font-size:11.5px;line-height:100%;}'+
				'.dungeonHeroPic{width:32px;height:32px;float:left;background:url('+Game.resPath+'img/dungeonHeroes.png?v='+Game.version+');cursor:pointer;}'+
				'.dungeonHeroItems{clear:both;}'+
			'.dungeonItem{width:48px;height:48px;display:inline-block;background-image:url('+Game.resPath+'img/dungeonItems.png?v='+Game.version+');background-color:rgba(0,0,0,0.25);box-shadow:0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 0px 0px 2px rgba(255,255,255,0.2) inset,0px 0px 4px 4px rgba(0,0,0,0.5) inset;margin:0px;}'+
			'.dungeonSlot{transform:scale(0.5);margin:-12px;cursor:pointer;}'+
			'.dungeonEmptySlot{background-image:none;cursor:auto;}'+
			'.dungeonSlotAccept{box-shadow:0px 0px 1px 2px #fff;z-index:1000;}'+
			'.dungeonSlotNoAccept{opacity:0.5;}'+
			
			'#dungeonFeatures{display:none;}'+
			'.dungeonButton{border-radius:3px;margin:2px;background:rgba(0,0,0,0.3);box-shadow:0px 0px 0px 1px rgba(0,0,0,0.75),0px 1px 0px rgba(255,255,255,0.3) inset,0px 0px 0px 2px rgba(255,255,255,0.1);font-size:11.5px;padding:2px 4px;cursor:pointer;}'+
			'.dungeonButton:hover{background:rgba(255,255,255,0.15);}'+
			'.dungeonButton:active{background:rgba(0,0,0,0.6);}'+
			
			'#dungeonPartyXPwrap{position:relative;border-radius:2px;font-size:10px;line-height:0px;font-weight:bold;background:linear-gradient(to bottom,#222,#666);width:100%;height:5px;box-shadow:0px 0px 0px 1px rgba(0,0,0,0.5);text-shadow:0px 1px 0px #000,1px 0px 0px #000,-1px 0px 0px #000,0px 1px 3px #000;}'+
				'#dungeonPartyXPlvl,#dungeonPartyXPprogress{position:absolute;top:-2px;width:100%;text-align:center;pointer-events:none;}'+
				'#dungeonPartyXPbox:hover #dungeonPartyXPlvl{display:none;}'+
				'#dungeonPartyXPprogress{display:none;}'+
				'#dungeonPartyXPbox:hover #dungeonPartyXPprogress{display:block;}'+
				'#dungeonPartyXP{width:0%;border-radius:2px;background:linear-gradient(to right,#00bf51,#cbff3f);width:100%;height:100%;box-shadow:0px 1px 0px #d9ffbb inset,1px 0px 0px rgba(0,0,0,0.5);transition:width 0.2s;}'+
			
			'#dungeonCombat{display:none;}'+
			'.dungeonInCombat #dungeonCombat{display:block;}'+
			'.dungeonInCombat #dungeonFeatures{display:none;}'+
			'#dungeonBattleHeader{color:#f00;font-size:12px;margin-bottom:4px;}'+
			
				'.dungeonHP{background:linear-gradient(to right,#bd1600,#ff6041);width:100%;height:100%;box-shadow:0px 1px 0px #ffa780 inset,1px 0px 0px rgba(0,0,0,0.5);transition:width 0.2s;}'+
				'.dungeonHPwrap{background:linear-gradient(to bottom,#222,#666);width:100%;height:2px;box-shadow:0px 0px 0px 1px rgba(0,0,0,0.5);}'+
				'.dungeonHero .dungeonHPwrap{position:absolute;left:34px;right:2px;width:auto;top:26px;height:4px;}'+
				/*'.dungeonInCombat .dungeonHPwrap{display:block;}'+*/
				
				'.dungeonHero.dungeonDead{opacity:0.5;color:#f00;}'+
				'.dungeonFoe.dungeonDead{opacity:0.5;}'+
					'.dungeonFoe.dungeonDead .dungeonFoePic{transform:rotate(90deg);}'+
				
			'.dungeonFoe{border-radius:4px;text-align:left;overflow:hidden;font-size:11.5px;line-height:100%; text-overflow:ellipsis;white-space:nowrap;text-indent:4px;}'+
				'.dungeonFoePic{vertical-align:middle;width:16px;height:16px;float:left;background:url('+Game.resPath+'img/dungeonFoes.png?v='+Game.version+');}'+
			'#dungeonDrag{display:none;pointer-events:none;position:absolute;left:0px;top:0px;z-index:1000000001;}'+
				'#dungeonDrag.dungeonDragOn{display:block;transition:transform 0.1s;}'+
				
			/*'.dungeonStat,.dungeonStatVal{font-variant:small-caps;font-family:Georgia,serif;font-size:11.5px;width:16%;display:inline-block;overflow:hidden;box-sizing:border-box;margin:0px;vertical-align:middle;}'+
			'.dungeonStat{color:rgba(255,255,255,0.6);text-align:right;}'+
			'.dungeonStatVal{color:#fff;text-align:left;font-weight:bold;}'+*/
			'.dungeonStat{font-variant:small-caps;font-family:Georgia,serif;font-size:11.5px;display:inline-block;overflow:hidden;box-sizing:border-box;margin:1px;vertical-align:middle;}'+
			//'#dungeonSide{text-align:center;position:absolute;padding:8px 4px;background:linear-gradient(-45deg,rgba(33,161,141,1),rgba(33,161,141,0) 75%),url('+Game.resPath+'img/brownStripesLeftEdge.png),url('+Game.resPath+'img/brownStripes.png);background-repeat:no-repeat,repeat-y,repeat;background-blend-mode:color-dodge,normal;top:0px;bottom:0px;right:0px;width:192px;z-index:100;}'+
		'</style>';
		str+='<div id="dungeonBG"></div>';
		str+='<div id="dungeonContent">';
			str+='<div id="dungeonDrag" class="shadowFilter" style="position:fixed;backface-visibility:hidden;"></div>';
			str+=
				'<div id="dungeonMap">'+
					'<div id="dungeonMapBG" class="crisp"></div>'+
					'<div id="dungeonMapOver" class="shadowFilter"></div>'+
				'</div>'+
				'<div id="dungeonDebug" style="position:absolute;left:0px;bottom:0px;font-family:Verdana;z-index:100;pointer-events:none;"></div>'+
				'<div id="dungeonSide">'+
					'<div id="dungeonInvLabel" style="text-align:left;color:rgba(255,255,255,0.5);position:relative;top:4px;margin-top:-4px;">Inventory<div id="dungeonGold" style="float:right;color:#f2d871;margin-right:4px;text-shadow:0px 1px 0px #833400;font-weight:bold;">0 gold</div></div>'+
					'<div id="dungeonInv" class="dungeonInset dungeonSlotset"></div>'+
					'<div id="dungeonPartyLabel" style="text-align:left;color:rgba(255,255,255,0.5);position:relative;top:4px;margin-top:-4px;">Party</div>'+
					'<div id="dungeonPartyXPbox" style="cursor:pointer;" class="dungeonInset"><div id="dungeonPartyXPwrap"><div id="dungeonPartyXP"></div><div id="dungeonPartyXPlvl"></div><div id="dungeonPartyXPprogress"></div></div></div>'+
					'<div id="dungeonParty" class="dungeonInset dungeonSlotset"></div>'+
					'<div class="dungeonLine"></div>'+
					'<div id="dungeonLocTitle" class="dungeonInset" style="font-size:16px;font-weight:bold;"></div>'+
					'<div id="dungeonFeatures" class="dungeonInset"></div>'+
					'<div id="dungeonCombat" class="dungeonInset"></div>'+
					'<div id="dungeonLog" class="dungeonInset"></div>'+
				'</div>'+
				'<div id="dungeonOverlay"><div id="dungeonBurst"></div></div>'+
			'';
		str+='</div>';
		div.innerHTML=str;
		
		
		M.l=l('dungeonContent');
		M.mapL=l('dungeonMap');
		M.mapBG=l('dungeonMapBG');
		M.mapOverL=l('dungeonMapOver');
		M.dragL=l('dungeonDrag');
		M.lvlL=l('dungeonPartyXPlvl');
		M.xpL=l('dungeonPartyXPprogress');
		M.xpBar=l('dungeonPartyXP');
		
			Game.attachTooltip(l('dungeonPartyXPbox'),function(){return '<div class="prompt" style="width:300px;text-align:center;padding:8px;">This is your <b>XP bar</b>.<div class="line"></div>You gain <b>XP</b> (experience points) by killing foes.<br>Foes usually give XP equal to their level.<br>If your level is higher than your foe\'s, they give 1 less XP for every level you have over them.<div class="line"></div>Earning enough XP to fill up this bar will <b>level up</b> all your heroes, making them stronger.<div class="line"></div>You currently have <b>'+Beautify(M.xp)+' XP</b>, and need <b>'+Beautify(M.xpToNext()-M.xp)+'</b> more to reach level <b>'+Beautify(M.lvl+1)+'</b>.</div>';},'this');
		
			AddEvent(M.l,'mousedown',function(){M.mapClicked=true;});
			AddEvent(l('dungeonSide'),'mousedown',function(e){M.mapClicked=false;e.stopPropagation();});
		
		M.bounds=0;
		M.boundsPanel=0;
		M.onResize=function()
		{
			M.bounds=M.l.getBounds();
			M.boundsPanel=l('dungeonSide').getBounds();
		}
		M.onResize();
		
		
		M.burst=function(str)
		{
			var div=document.createElement('div');
			div.className='dungeonBurst';
			div.innerHTML=str;
			l('dungeonBurst').appendChild(div);
			setTimeout(function(div){return function(){if (div){div.parentNode.removeChild(div);}}}(div),2500);
		}
		
		M.logs=[];
		M.lastLogT=0;
		M.logL=l('dungeonLog');
			AddEvent(M.logL,'mouseout',function(e){if (e.target==M.logL){setTimeout(function(){M.logL.scrollTop=M.logL.scrollHeight;},250);}});//not perfect
		M.log=function(str,classes,pic)
		{
			setTimeout(function(str,classes,pic){return function(){
				if (!M.logL) return false;
				var div=document.createElement('div');
				if (classes) classes='dungeonLogMessage-'+classes.split(' ').join(' dungeonLogMessage-');
				div.className='dungeonLogMessage comeLeft'+(classes?(' '+classes):'');
				str='<div class="dungeonLogMessageBody">'+str+'</div>';
				if (pic) str='<div class="dungeonFoePic dungeonLogMessagePic" style="background-position:'+(-pic[0]*16)+'px '+(-pic[1]*16)+'px;"></div>'+str;
				div.innerHTML=str;
				M.logL.appendChild(div);
				M.logs.push({l:div});
				if (M.logs.length>50)
				{
					M.logs[0].l.parentNode.removeChild(M.logs[0].l);
					M.logs.shift();
				}
				M.logL.scrollTop=M.logL.scrollHeight;
				M.lastLogT-=100;
				if (M.lastLogT<0) M.lastLogT=0;
			}}(str,classes,pic),Math.max(0,M.lastLogT));
			M.lastLogT+=100;
		}
		
		M.log('<b>Welcome to the dungeons!</b>','black');
		M.setTeam(['chip']);
		//M.setTeam(['chip','crumb','doe','lucky']);
		M.initInv();
		M.homeLoc=M.locsBN['lobby'];
		M.setLoc('lobby');
		//setTimeout(function(){M.combat(['angry sentient cookie','baby sentient cookie']);},100);
		
		M.updateXPdisplay();
		
		for (var i in M.team)
		{
			if (M.team[i].hero)
			{
				M.team[i].hero.say('greeting');
			}
		}
		
		
		setTimeout(function(){M.computeMapBounds();M.centerLoc();},50);
		
		M.parent.switchMinigame(1);
	}
	M.save=function()
	{
		//output cannot use ",", ";" or "|"
		var saveSlot=function(me)
		{
			if (me.item==0) return '0';
			var str=''+
			parseInt(me.item.type.id)+'_'+
			parseInt(me.item.n);
			return str;
		};
		
		var saveHero=function(me)
		{
			if (me.hero===null) return '0';
			var str=''+
			parseInt(me.hero?me.hero.id:0)+' '+
			parseInt(me.hp)+' '+
			saveSlot(me.gear[0])+' '+
			saveSlot(me.gear[1])+' '+
			saveSlot(me.gear[2])+' '+
			saveSlot(me.gear[3])+
			'';
			return str;
		};
		
		var saveInv=function()
		{
			var str='';
			for (var i=0;i<M.invM;i++)
			{
				str+=saveSlot(M.inv[i])+' ';
			}
			return str;
		};
		
		var saveLocs=function()
		{
			var str='';
			for (var i=0;i<M.locs.length;i++)
			{
				str+=parseInt(M.locs[i].visited?'1':'0')+'';
			}
			return str;
		};
		
		var str=''+
		parseInt(M.parent.onMinigame?'1':'0')+':'+
		parseFloat(M.lvl)+':'+
		parseFloat(M.xp)+':'+
		parseInt(M.onLoc.id)+':'+
		saveInv()+':'+
		saveHero(M.team[0])+':'+
		saveHero(M.team[1])+':'+
		saveHero(M.team[2])+':'+
		saveHero(M.team[3])+':'+
		saveLocs()+':'+
		//parseInt(Math.floor(M.var))+':'+
		'';
		return str;
	}
	M.load=function(str)
	{
		//interpret str; called after .init
		//note : not actually called in the Game's load; see "minigameSave" in main.js
		if (!str) return false;
		
		
		var loadSlot=function(type,i,str)
		{
			//type is -1 for inv, 0-1-2-3 for hero
			//i is which specific slot
			if (str=='0') return false;
			var spl=str.split('_');
			var item=new M.itemInst(M.items[parseInt(spl[0])],parseInt(spl[1]||1));
			if (type==-1) item.slotIn(M.inv[i]);
			else if (type>=0) item.slotIn(M.team[type].gear[i]);
		};
		
		var loadHero=function(str,me)
		{
			if (!str) return false;
			if (str=='0') return false;
			var spl=str.split(' ');
			var i=0;
			me.hero=M.heroes[parseInt(spl[i++]||0)];
			M.heroComputeStats(me);
			me.hp=parseFloat(spl[i++]||me.hpm);
			loadSlot(me.i,0,spl[i++]);
			loadSlot(me.i,1,spl[i++]);
			loadSlot(me.i,2,spl[i++]);
			loadSlot(me.i,3,spl[i++]);
		};
		
		var loadInv=function(str)
		{
			if (!str) return false;
			var spl=str.split(' ');
			for (var i=0;i<M.invM;i++)
			{
				if (typeof spl[i]!=='undefined') loadSlot(-1,i,spl[i]);
			}
		};
		
		var loadLocs=function(str)
		{
			if (!str) return false;
			var spl=str.split('');
			for (var i=0;i<M.locs.length;i++)
			{
				M.locs[i].visited=spl[i]=='1'?true:false;
			}
		};
		
		var i=0;
		var spl=str.split(':');
		var on=parseInt(spl[i++]||0);if (on && Game.ascensionMode!=1) M.parent.switchMinigame(1);
		M.lvl=parseFloat(spl[i++]||1);
		M.xp=parseFloat(spl[i++]||0);
		M.setLoc(M.locs[spl[i++]]||'lobby');
		
			for (var ii=0;ii<M.invM;ii++)
			{
				M.inv[ii].item=0;
				M.inv[ii].refresh();
			}
		loadInv(spl[i++]||0);
			for (var ii=0;ii<4;ii++)
			{
				var me=M.team[ii];
				me.hero=null;
				me.hp=0;
				me.gear[0].item=0;
				me.gear[0].refresh();
				me.gear[1].item=0;
				me.gear[1].refresh();
				me.gear[2].item=0;
				me.gear[2].refresh();
				me.gear[3].item=0;
				me.gear[3].refresh();
			}
		loadHero(spl[i++]||0,M.team[0]);
		loadHero(spl[i++]||0,M.team[1]);
		loadHero(spl[i++]||0,M.team[2]);
		loadHero(spl[i++]||0,M.team[3]);
		M.refreshTeam();
			for (var ii=0;ii<M.locs.length;ii++)
			{
				var me=M.locs[ii];
				me.visited=false;
			}
		loadLocs(spl[i++]||0);
		M.updateLocStyles();
		M.centerLoc();
		M.updateXPdisplay();
		//M.var=parseInt(spl[i++]||0);
	}
	M.reset=function()
	{
		M.launch();
	}
	M.logic=function()
	{
		//run each frame
		
		if (M.inCombat) M.combatLogic();
		else M.moveLogic();
		
		M.mapControl();
	}
	M.draw=function()
	{
		//run each draw frame
		//M.mapL.style.transform='translate('+(M.mapOffX)+'px,'+(M.mapOffY)+'px)';
		M.mapL.style.transform='translate('+((M.bounds.right-M.bounds.left)/2+M.mapOffX-(M.boundsPanel.right-M.boundsPanel.left)/2)+'px,'+((M.bounds.bottom-M.bounds.top)/2+M.mapOffY)+'px)';
		
		//bobbing sprites on map
		var prev=0;
		for (var i=0;i<M.team.length;i++)
		{
			var me=M.team[i];
			if (me.sprite)
			{
				if (i==0)
				{
					var x=0;
					var y=0;
					if (M.toLoc)
					{
						var loc1=M.onLoc;
						var loc2=M.toLoc;
						x=(loc1.x+(loc2.x-loc1.x)*M.toLocR)*5;
						y=(loc1.y+(loc2.y-loc1.y)*M.toLocR)*5;
					}
					else
					{
						x=M.onLoc.x*5;
						y=M.onLoc.y*5
					}
					if (me.x==-10000){me.x=x;me.y=y;}
					else
					{
						me.x+=(x-me.x)*0.2;
						me.y+=(y-me.y)*0.2;
					}
				}
				else if (me.x==-10000) {me.x=prev.x;me.y=prev.y;}
				else if (Math.sqrt((prev.x-me.x)*(prev.x-me.x)+(prev.y-me.y)*(prev.y-me.y))>16)
				{
					me.x+=(prev.x-me.x)*0.1;
					me.y+=(prev.y-me.y)*0.1;
				}
				
				me.sprite.style.transform='translate('+(me.x)+'px,'+(me.y-5-Math.abs(Math.sin(Game.T*0.2-me.i*Math.PI/4))*(me.hp/me.hpm)*10)+'px)';
				prev=me;
			}
		}
		
		M.dragDraw();
	}
	M.init(l('rowSpecial'+M.parent.id));
}
var M=0;