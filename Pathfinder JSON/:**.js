/**
 * Chaos Spell Picker:
 * This is a script that randomizes a wizard's daily spells known.
 * It also links to the spell's description on the pfsrd, although
 * I can't promise that it will be 100% accurate, as the only edge case
 * I've run into is summon monster.
 * The reason this exists? Chaos.
 * @author iamthereplicant
 * @version 1.0
 * 
 * Setup
 * ------------
 * Create a handout with the following format:
 * level_1
 * spell1
 * spell2
 * 
 * level_2
 * spell3
 * spell4
 * 
 * ...etc
 * Get the handout's ID, and set it as a global variable named handout_id
 * 
 * Use
 * ------------
 * in chat (you don't need the parenthesis): !randomSpells (wizard_level) (int_mod)
 * 
 * Future upgrades: Allow people to pass in handout Id's for groups with multiple wizards
 */
 
//SET THIS TO YOUR HANDOUT
var handout_id = "-JrGIAAN8WK8OyVgbME4";
 
on("chat:message", function(msg){
    log(msg.content);
    if (msg.type !== "api") return;
    if(msg.content.split(" ",1)[0] ===  "!randomSpells"){
        log(parseInt(msg.content.split(" ")[1]));
        
        //Grab level and int mod from chat
        var level = parseInt(msg.content.split(" ")[1]);
        var int_mod = parseInt(msg.content.split(" ")[2]);  
        log("LEVEL: "+level);
        log("INT_MOD: " + int_mod);
        
        //Get spell list from handout
        var handout = getObj("handout", handout_id);
        var spell_level = 0;
        handout.get("notes", function(notes){
            var tokens = notes.split("<br>");
            var jsonToBuild = {};
            jsonToBuild[0] = [];
            for(var token in tokens){
                if(tokens[token] === "level_0"){
                } else if (tokens[token].indexOf("level_") > -1){
                    spell_level++;
                    jsonToBuild[spell_level] = [];
                } else if (tokens[token]){
                    jsonToBuild[spell_level].push(tokens[token]);
                }
            }
            
            //Run that shit
            var msg_json = getSpells(level, int_mod, jsonToBuild);
            for(var i = 0; i <= Math.ceil(level/2); i++){
                sendChat("GM", jsonToTemplate(msg_json, i));
            }
        });
    }
});

function getBonusByCastStat(spell_level, int){
    log("Getting spells by cast stat: " + int);
    if(int > 0){
        if(int < spell_level){
            log("Int less than spell level, returning 0");
            return 0;
        } else if (int === spell_level) {
            log("inteligence == spell level, returning 1");
            return 1;
        } else {
            var bonus = 1;
            var int_mod = int;
            while(int_mod - 4 > spell_level){
                bonus++;
                int_mod = int_mod - 4;
            }
            return bonus;
        }
    } else {
        return 0;
    }
}

function getNumberOfSpellsByLevel(level, int){
    log("Getting number of spells by level");
    var spellsPerDay = [];
    var number = 1;
    for(var i = Math.ceil(level/2); i > -1; i--){
        var base_spells = Math.min(number, 4);
        if(i === 0){
          spellsPerDay[i] = 4;
        } else {
          log("spells by level");
          log("base spells" + base_spells);
          log("Cast stat: " +getBonusByCastStat(i, int));
          spellsPerDay[i] = base_spells + getBonusByCastStat(i, int);
        }
        number++;
    }
    //log(spellsPerDay);
    return spellsPerDay;
}

function getSpells(level, int, spell_list_json){
    log("starting getSpells");
    var spells_memorized = {};
    var spells_known = spell_list_json;
    var number_of_spells_by_level = getNumberOfSpellsByLevel(level,int);
    log("Starting loop");
    for(var spell_level = 0; spell_level < number_of_spells_by_level.length; spell_level++){
        var toRandom = number_of_spells_by_level[spell_level];
        spells_memorized['level_'+spell_level] = {};
        while(toRandom > 0){
            if(spells_known[spell_level].length > 0) {
                var toAdd = spells_known[spell_level][getRandomInt(0, spells_known[spell_level].length)];
                if (toAdd in spells_memorized['level_' + spell_level]) {
                    log(toAdd + ' was present, incrementing');
                    spells_memorized['level_' + spell_level][toAdd] = spells_memorized['level_' + spell_level][toAdd] + 1;
                } else {
                    spells_memorized['level_' + spell_level][toAdd] = 1;
                    if (spell_level == 0) {
                        log("deleting spell from spell list because you can't duplicate cantrips");
                        log(toAdd);
                        log(spells_known[spell_level].indexOf(toAdd));
                        spells_known[spell_level].splice(spells_known[spell_level].indexOf(toAdd), 1);
                    }
                }
                toRandom--;
            }
        }
    }

    return spells_memorized;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getUrl(string){
    var baseUrl = "http://www.d20pfsrd.com/magic/all-spells/"
    var first_char = string.charAt(0);
    
    if(string.toLowerCase().indexOf("summon monster") != -1){
        string = "summon-monster";
    }
    var final_bit_of_url = string.split(' ').join('-').toLowerCase();
    var final_url = baseUrl + first_char.toLowerCase() + "/" + final_bit_of_url;
    return final_url;
}

function jsonToTemplate(json, level){
    var base = "&{template:default}{{name=Today's Random Spells: Level ";
    var close_base = "}}";
    var jsonToReturn = "";

    var objectWeCareAbout = json["level_"+level];
    var keySet = Object.keys(objectWeCareAbout);
    keySet.sort();
    
    if(objectWeCareAbout){
        log(objectWeCareAbout);
        jsonToReturn = base + level + close_base;
        for(var i = 0; i < keySet.length; i++){
            jsonToReturn += "{{[" + keySet[i] +"](" + getUrl(keySet[i]) + ")=" + objectWeCareAbout[keySet[i]] +"}}";
        }
    } else {
        log("no data in jsonToTemplate");
        return "";
    }
    log(jsonToReturn);
    return jsonToReturn;
}