const serverUrl = "https://pglou4w74ndp.usemoralis.com:2053/server";
const appId = "9zLIf3wZjx3kiw3M5b8YzPezfcvL4YV95YFdqPeo";
Moralis.start({ serverUrl, appId });

window.onload = function(){
  document.getElementById("btn-logout").style.display = "none";
};

let height = screen.height/2;
let width = screen.width/2;

var config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    resolution: window.devicePixelRatio,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        parent: 'game',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    }
};

var game;
var platforms;
var player;
var competitors = {};
var cursor;
var jumpHeight = -300;

function launch(){
  let user = Moralis.User.current();
  if(!user){
    console.log("Login into metamask please");
    game = null;
  }else{
    console.log("Logged into metamask with "+user.get('ethAddress')+" wallet");

    game = new Phaser.Game(config);
    
  }

};

launch();

function preload ()
{
        this.load.image('background', 'assets/Maps/background/BG.png');
        this.load.image('ground-right', 'assets/Maps/tileset/3.png');
        this.load.image('ground-middle', 'assets/Maps/tileset/2.png');
        this.load.image('ground-left', 'assets/Maps/tileset/1.png');
        this.load.image('competitor', 'assets/Maps/tileset/Idle-1.png');
        this.load.spritesheet('player', 
        'assets/Sprites/hero/Idle-1.png',
            { frameWidth: 32, frameHeight: 48 }
        );
}

async function create ()
{
    this.add.image(400, 300, 'background');

    platforms = this.physics.add.staticGroup();

    platforms.create(50,600, 'ground-left');
    platforms.create(178,600, 'ground-middle');
    platforms.create(306,600, 'ground-middle');
    platforms.create(434,600, 'ground-middle');
    platforms.create(562,600, 'ground-middle');
    platforms.create(690,600, 'ground-right');

    player = this.physics.add.sprite(100, 450, 'player').setScale(3).refreshBody();

    player.setBounce(0);
    player.setCollideWorldBounds(true);
    
    this.physics.add.collider(player, platforms);

    cursors = this.input.keyboard.createCursorKeys();

    let user = Moralis.User.current();
    let query = new Moralis.Query('PlayerPosition');
    let subscription = await query.subscribe();

    subscription.on('create', (pLocation) => {
      if(pLocation.get("player") != user.get("ethAddress")){
        
        //if first time seeing
        if(competitors[pLocation.get("player")] == undefined){
          //create sprite
          competitors[pLocation.get("player")] = this.add.image(pLocation.get("x"), pLocation.get("y"), 'competitor').setScale(3);

        }else{
          competitors[pLocation.get("player")].x = pLocation.get("x");
          competitors[pLocation.get("player")].y = pLocation.get("y");
        }

        console.log("Esta se movendo!");
        console.log(pLocation.get("player"));
        console.log("new x", pLocation.get("x"));
        console.log("new x", pLocation.get("y"));
      }
    });

}

async function update (){
  
let logged = Moralis.User.current();

//Verificar se esta logado na metamask
if(logged){
  //Esta logado
  document.getElementById("btn-login").style.display = "none";
  document.getElementById("btn-logout").style.display = "inline";
}else{
  //Nao esta logado
  document.getElementById("btn-login").style.display = "inline";
  document.getElementById("btn-logout").style.display = "none";
}
//------------------------------------

//Controles do personagem
if (cursors.left.isDown)
{
    player.setVelocityX(-160);

}
else if (cursors.right.isDown)
{
    player.setVelocityX(160);

}
else
{
    player.setVelocityX(0);
}

if ( (cursors.space.isDown && player.body.touching.down) || (cursors.up.isDown && player.body.touching.down))
{
    player.setVelocityY(jumpHeight);
}

if(player.lastX!=player.x || player.lastY!=player.y){
  let user = Moralis.User.current();

  //criando uma nova classe na base de dados do Moralis
  const PlayerPosition = Moralis.Object.extend("PlayerPosition");
  const playerPosition = new PlayerPosition();

  playerPosition.set("player", user.get("ethAddress"));
  playerPosition.set("x", player.x);
  playerPosition.set("y", player.y);
  
  player.lastX = player.x;
  player.lastY = player.y;

  await playerPosition.save();

}

//-------------------------------------



}




// Control Login in Blockchain
async function login() {
  let user = Moralis.User.current();
  if (!user) {
   try {
      user = await Moralis.authenticate({ signingMessage: "Hello World!" })
      console.log(user)
      console.log(user.get('ethAddress'))
      launch()
   } catch(error) {
     console.log(error)
   }
  }
}

async function logOut() {
  await Moralis.User.logOut();  
  console.log("logged out");
  location.reload();
}


document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;

//------------------------------------------------------