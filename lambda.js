/*------------------------GAME VARIABLES FUNCTIONS--------------------------*/
var playerHealth = 100;
var numTreasures = 0;
const numTreasuresNeeded = 10;
var currentRoom = {number: 0};

const enemies = [
    {name:"Snake", hp:5},
    {name:"Goblin", hp:10},
    {name:"Goblin King", hp:15},
    {name:"Ghost", hp:10},
    {name:"Knight", hp:20},
    {name:"Dark Knight", hp:30},
    {name:"Dark Magician", hp:20},
    {name:"Master Wizard", hp:30},
    {name:"DRAGON", hp:50}
];
const enemyAdjectives = [
    "menacing",
    "angry",
    "dark",
    "evil",
    "powerful",
    "scary",
    "spooky",
    "deadly",
    "annoying"
];

/*------------------------HANDLER FUNCTION--------------------------*/
exports.handler = (event, context, callback) => {
    try{
        if (event.session.application.applicationId !== 'amzn1.ask.skill.e516788b-8910-4450-90f5-1de595744dd0') {
             callback('Invalid Application ID');
        }
        
        switch (event.request.type){
            case 'LaunchRequest':
                callback(null, buildResponse('Say "Start Game" to start a new game'));
                break;
            case 'IntentRequest':
                switch (event.request.intent.name){
                    case 'StartGame':
                        callback(null, buildResponse(startNewGame()));
                        break;
                    case 'Continue': // Move on to next room
                        let nextRoomResponse = nextRoom();
                        if (nextRoomResponse === 'WIN')
                            callback(null, buildResponse('Congratulations! You found all '+numTreasuresNeeded+ ' treasures! Come back soon!', true));
                        else
                            callback(null, buildResponse(nextRoomResponse));
                        break;
                    case 'Attack': // Attack monster in room
                        let attackResponse = attack();
                        if (attackResponse === 'GAME OVER')
                            callback(null, buildResponse('You were defeated! You collected '+numTreasures+ ' out of ' +numTreasuresNeeded+ ' treasures! Better luck next time!', true));
                        else
                            callback(null, buildResponse(attackResponse));
                        break;
                    case 'Flee': // Run away from monster in room
                        let fleeResponse = flee();
                        if (fleeResponse === 'GAME OVER')
                            callback(null, buildResponse('You were defeated! You collected '+numTreasures+ ' out of 10 treasures! Better luck next time!', true));
                        else
                            callback(null, buildResponse(fleeResponse));
                        break;
                    case 'AMAZON.CancelIntent':
                        callback(null, buildResponse('Goodbye', true));
                        break;
                    case 'AMAZON.HelpIntent':
                        callback(null, buildResponse('Help text here'));
                        break;
                    case 'AMAZON.StopIntent':
                        callback(null, buildResponse('Goodbye', true));
                        break;
                    default:
                        callback(null, buildResponse('Invalid intent'));
                        break;
                }
                break;
            case 'SessionEndedRequest':
                callback(null, buildResponse('Goodbye', true));
                break;
            default:
                callback(null, buildResponse('Invalid request'));
                break;
        }
    }
    catch(err){
        callback(null, buildResponse(err));
    }
};

/*------------------------GAME ACTION FUNCTIONS--------------------------*/
function startNewGame(){
    playerHealth = 100;
    numTreasures = 0;
    currentRoom = {type: 'empty', number: 0};
    return nextRoom();
}

function nextRoom(){
    if (currentRoom.type === 'monster'){
        return 'A ' +currentRoom.enemy.name+ ' blocks the path! You may attack or flee.';
    }
    else{
        currentRoom = generateRoom();
        return currentRoom.text;
    }
}

function attack(){
    if (currentRoom.type !== 'monster'){
        return 'There\'s nothing in this room to attack. You must continue forward';
    }
    
    let playerDmg = Math.floor(Math.random() * (21 - 1)) + 1; // Damage player deals to enemy
    let enemyDmg = Math.floor(Math.random() * (11 - 1)) + 1; // Damage enemy deals to player
    
    currentRoom.enemy.hp -= playerDmg;
    if (currentRoom.enemy.hp <= 0){
        currentRoom.type = 'monster_defeated';
        return 'You defeated the ' +currentRoom.enemy.name+ '! You may continue onward.';
    }
    else{
        playerHealth -= enemyDmg;
        if (playerHealth <= 0)
            return 'GAME OVER';
        else
            return 'You attacked the ' +currentRoom.enemy.name+ ' for ' +playerDmg+ ' damage. It attacks you for ' +enemyDmg+ ' damage. You may attack again or flee.';
    }
}

function flee(){
    var fleeChance = Math.random();
    if (fleeChance < 0.4){
        currentRoom.type = 'monster_fled';
        return 'You attempt to flee from the ' +currentRoom.enemy.name+ '. You succeed! You may now continue to the next room.';
    }
    else{
        let enemyDmg = Math.floor(Math.random() * (11 - 1)) + 1; // Damage enemy deals to playerplayerHealth -= enemyDmg;
        if (playerHealth <= 0)
            return 'GAME OVER';
        else
            return 'You attempt to flee from the ' +currentRoom.enemy.name+ '. You fail! It attacks you for ' +enemyDmg+ ' damage! Attack or attempt to flee again.';
    }
}

/*------------------------GAME GENERATOR FUNCTIONS--------------------------*/
function generateRoom(){
    let room = {};
    room.number = currentRoom.number + 1;
    
    let chance = Math.random(); // Random # to determine what will be in the room
    if (chance <= 0.6){
        room.type = 'monster';
        room.enemy = generateEnemy();
        room.text = 'This room contains a ' +room.enemy.name+ '! You may attack it or try to flee.';
    }
    else if (chance > 0.6 && chance <= 0.8){
        numTreasures++;
        if (numTreasures >= numTreasuresNeeded){
            return {text:'WIN'};
        }
        room.type = 'treasure';
        room.text = 'You find a room full of treasure. Only ' +(numTreasuresNeeded - numTreasures)+ ' to go! Your only option is to continue forward.';
    }
    else{
        room.type = 'empty';
        room.text = 'This room is empty. Your only option is to continue forward.';
    }
    
    return room;
}

function generateEnemy(){
    let enemyChance = Math.floor(Math.random()*enemies.length);
    let adjectiveChance = Math.floor(Math.random()*enemyAdjectives.length);
    let enemy = {
        name: enemyAdjectives[adjectiveChance] + ' ' + enemies[enemyChance].name,
        hp: enemies[enemyChance].hp
    };
    return enemy;
}

/*------------------------HELPER FUNCTIONS--------------------------*/
function buildResponse(output, shouldEndSession=false){
    return {
        response: {
            outputSpeech: {
                type: "PlainText",
                text: output
            },
            reprompt: {
                outputSpeech: {
                    type: "PlainText",
                    text: output
                }
            },
            shouldEndSession
        }
    };
}
