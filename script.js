//a csempe mozgási sebessége pixelben képkockánként
const TILE_SPEED = 25,
COMBINING_TIME=200,
SPAWNING_TIME=200;

class Tile {
	constructor(value,startPosition) {
		//a csempe aktuálsi értéke
		this.value=value;
		//a csempe értéke a kombinálás után
		this.combiningValue=value;
		//a csempe pozíciója a négyzetrácson belül
		this.startPosition=startPosition;
		//a csempe cél pozíciója, ahová az animáció után kerül
		this.targetPosition=_.cloneDeep(startPosition);
		//a csempe abszolút pozíciója a kiinduló pozíciójához képest pixelben
		this.top=0;
		this.left=0;
		this.bottom=0;
		this.right=0;
		//a csempe állapota
		this.state="spawning";
		//a csempe generálásának időpontja
		this.generatedAt=null;
		//a csempe kombinálásának időpontja
		this.combinedAt=undefined;
	}
}

var grid = document.getElementById("grid"),
cellDivs = document.getElementsByClassName("cellDiv"),
tileDivs = document.getElementsByClassName("tile"),
tiles=[],
animationFrameID,
state="stopped",
isCalculating,
needToGenerateNewTile,
alreadyWon,
removeClassTimeout,
score,
scoreIncrement,
highScore=0,
offset,
i,j,x,y;

for(i=0;i<4;i++){
	for(j=0;j<4;j++){
		let cellDiv = document.createElement("div");
		let tileBackground = document.createElement("div");
		let tileDiv = document.createElement("div");
		cellDiv.classList.add("cell");
		tileBackground.classList.add("tile-background");
		tileDiv.classList.add("tile");
		tileBackground.appendChild(tileDiv);
		cellDiv.appendChild(tileBackground);
		grid.appendChild(cellDiv);
	}
}
tileDivHeight = tileDivs[0].scrollHeight;

this.addEventListener("keydown",(event)=>{
	switch(event.key) {
		case "ArrowLeft" : {
			if (state==="running") {
				resetTiles();
				moveLeft();
			}
			break;
		}
		case "ArrowUp" : {
			if (state==="running") {
				resetTiles();
				moveUp();
			}
			break;
		}
		case "ArrowRight" : {
			if (state==="running") {
				resetTiles();
				moveRight();
			}
			break;
		}
		case "ArrowDown" : {
			if (state==="running") {
				resetTiles();
				moveDown();
			}
			break;
		}
	}
});

function updateTileAfterMoving(tile){
	setTimeout(()=>{
		if (tile.combiningValue!==tile.value) {
			tile.value=tile.combiningValue;
			tile.combinedAt=null;
			tile.state="combining";
		} else {
			tile.state="standing";
		}
		tile.top=0;
		tile.left=0;
		tile.bottom=0;
		tile.right=0;
		tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.top=0+"px";
		tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.left=0+"px";
		tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.bottom=0+"px";
		tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.right=0+"px";
		tile.startPosition=_.cloneDeep(tile.targetPosition);
		deleteDuplicatesByCombiningValue();
	});
}

function resetTiles() {
	tiles.forEach(tile=>{
		if (tile.state=="moving") {
			updateTileAfterMoving(tile);
		} else if (tile.state=="spawning") {
			tile.state="standing";
			tile.generatedAt=undefined;
			tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.remove("spawning");
			didYouWin();
			isGameOver();
		} else if (tile.state=="combining") {
			tile.state="standing";
			tile.combinedAt=undefined;
			tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.remove("combining");
		}
	});

	for(i=0;i<tileDivs.length;i++) {
		tileDivs[i].style.top=0+"px";
		tileDivs[i].style.left=0+"px";
		tileDivs[i].style.bottom=0+"px";
		tileDivs[i].style.right=0+"px";
	}
}

function deleteDuplicatesByCombiningValue() {
	/*a csempéket a kombinált érték szerint csökkenő sorrendbe rendezzük
	hogy csak a nagyobb értékkel rendelkező, kombinált csempét hagyjuk meg*/
	tiles = tiles.sort((a,b)=>b.combiningValue-a.combiningValue);
	tiles = tiles.filter((tile,index,arr)=>{
		return index===arr.findIndex(t=>t.targetPosition.y===tile.targetPosition.y 
			&& t.targetPosition.x===tile.targetPosition.x)
	})
}

function isEveryTileStanding() {
	return tiles.every(tile=>tile.state==="standing");
}

function isGameOver() {
	if (tiles.length===16) {
		const isMovementPossible = tiles.some((t,index,arr)=>
			arr.some(tile=>tile.startPosition.x===t.startPosition.x 
				&& (tile.startPosition.y===t.startPosition.y-1 || tile.startPosition.y===t.startPosition.y+1)
				&& tile.value===t.value) || 
			arr.some(tile=>(tile.startPosition.x===t.startPosition.x-1 || tile.startPosition.x===t.startPosition.x+1)
			&& tile.startPosition.y===t.startPosition.y
			&& tile.value===t.value)
		)

		if (isMovementPossible) {
			return false;
		} else {
			state="stopped";
			document.getElementById("game-over").style.display = "flex";
			if (score>highScore) {
				highScore=score;
				document.getElementById("high-score").innerHTML = highScore;
			}
			return true;
		}
	} else {
		return false;
	}
}

function didYouWin(){
	if (!alreadyWon && tiles.some(tile=>tile.value===2048)) {
		state="stopped";
		document.getElementById("you-win").style.display = "flex";
		return true;
	} else {
		return false;
	}
}

function keepOn(){
	state="running";
	alreadyWon=true;
	document.getElementById('you-win').style.display='none';
	if (animationFrameID) cancelAnimationFrame(animationFrameID);
	animationFrameID = requestAnimationFrame(update);
}

function generateNewTile() {
	generatedNumber = Math.random()<0.9?2:4;
	generatedPosition = {x:Math.floor(Math.random()*4),y:Math.floor(Math.random()*4)};

	while(tiles.some(tile=>tile.startPosition.x==generatedPosition.x && tile.startPosition.y==generatedPosition.y
			&& tile.targetPosition.x==generatedPosition.x && tile.targetPosition.y==generatedPosition.y)) {
		generatedPosition = {x:Math.floor(Math.random()*4),y:Math.floor(Math.random()*4)};
	}
	tiles.push(new Tile(generatedNumber,generatedPosition));

	needToGenerateNewTile=false;
}

function updateScore() {
	if (scoreIncrement) {
		score+=scoreIncrement;
		document.getElementById("score").innerHTML = score;
		document.getElementById("score-increment").classList.remove("show");

		if (removeClassTimeout) {
			clearTimeout(removeClassTimeout);
		}

		setTimeout(()=>{
			document.getElementById("score-increment").innerHTML = "+"+scoreIncrement;
			scoreIncrement=0;
			document.getElementById("score-increment").classList.add("show");
			removeClassTimeout = setTimeout(()=>{
				document.getElementById("score-increment").classList.remove("show");
			},1000);
		});
	}
}

function moveLeft() {
	isCalculating=true;
	for(y=0;y<4;y++){
		//megnézzük, hogy az adott csempe értéke egyezik e a következő csempe értékével
		for(x=1;x<4;x++){
			let tileToBeMoved = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==x);
			if (tileToBeMoved) {
				let offset=0;
				let nextTile;
				let k=x-1;
				while(k>=0 && !nextTile) {
					nextTile = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==k);
					/*ha egyezik az érték, akkor megadjuk az animáció végpontját, az értéket amire át
					kell majd állítani a korábbi értéket az animáció végeztével, és töröljük a célpozíción
					lévő azonos értékű csempét, hogy ne legyen két azonos értékű csempe ugyanazon a pozíción*/
					if (nextTile && nextTile.value==nextTile.combiningValue && tileToBeMoved.value==nextTile.value) {
						scoreIncrement+=(tileToBeMoved.combiningValue*=2);
						--tileToBeMoved.targetPosition.x;
						++offset;
						/*ha kombinálás történt, akkor újrarendezzük a csempéket, hogy az
						azonos pozíción lévő két csempe közül a nagyobb értékkel rendelkezőt
						válasszuk ki a következő iterációban. De még nem töröljük a kisebb értékű
						csempét, mert az animáció végéig jelen kell lennie.*/
						tiles = tiles.sort((a,b)=>b.combiningValue-a.combiningValue);
					} else if (!nextTile) {
						--tileToBeMoved.targetPosition.x;
						++offset;
					}

					--k;
				}

				if (offset>0) {		
					needToGenerateNewTile=true;
					tileToBeMoved.state="moving";
				}
			}
		}
	}

	updateScore();
	isCalculating=false;
}

function moveRight() {
	isCalculating=true;
	for(y=0;y<4;y++){
		for(x=2;x>=0;x--){
			let tileToBeMoved = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==x);
			if (tileToBeMoved) {
				let offset=0;
				let nextTile;
				let k=x+1;
				while(k<4 && !nextTile) {
					nextTile = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==k);

					if (nextTile && nextTile.value==nextTile.combiningValue && tileToBeMoved.value==nextTile.value) {
						scoreIncrement+=(tileToBeMoved.combiningValue*=2);
						++tileToBeMoved.targetPosition.x;
						++offset;
						tiles = tiles.sort((a,b)=>b.combiningValue-a.combiningValue);
					} else if (!nextTile) {
						++tileToBeMoved.targetPosition.x;
						++offset;
					}

					++k;
				}

				if (offset>0) {
					needToGenerateNewTile=true;
					tileToBeMoved.state="moving";
				}
			}
		}
	}

	updateScore();
	isCalculating=false;
}

function moveUp() {
	isCalculating=true;
	for(x=0;x<4;x++){
		for(y=1;y<4;y++){
			let tileToBeMoved = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==x);
			if (tileToBeMoved) {
				let offset=0;
				let nextTile;
				let k=y-1;
				while(k>=0 && !nextTile) {
					nextTile = tiles.find(tile=>tile.targetPosition.y==k && tile.targetPosition.x==x);

					if (nextTile && nextTile.value==nextTile.combiningValue && tileToBeMoved.value==nextTile.value) {
						scoreIncrement+=(tileToBeMoved.combiningValue*=2);
						--tileToBeMoved.targetPosition.y;
						++offset;
						tiles = tiles.sort((a,b)=>b.combiningValue-a.combiningValue);
					} else if (!nextTile) {
						--tileToBeMoved.targetPosition.y;
						++offset;
					}

					--k;
				}

				if (offset>0) {
					needToGenerateNewTile=true;
					tileToBeMoved.state="moving";
				}
			}
		}
	}

	updateScore();
	isCalculating=false;
}

function moveDown() {
	isCalculating=true;
	for(x=0;x<4;x++){
		for(y=2;y>=0;y--){
			let tileToBeMoved = tiles.find(tile=>tile.targetPosition.y==y && tile.targetPosition.x==x);
			if (tileToBeMoved) {
				let offset=0;
				let nextTile;
				let k=y+1;
				while(k<4 && !nextTile) {
					nextTile = tiles.find(tile=>tile.targetPosition.y==k && tile.targetPosition.x==x);
					if (nextTile && nextTile.value==nextTile.combiningValue && tileToBeMoved.value==nextTile.value) {
						scoreIncrement+=(tileToBeMoved.combiningValue*=2);
						++tileToBeMoved.targetPosition.y;
						++offset;
						tiles = tiles.sort((a,b)=>b.combiningValue-a.combiningValue);
					} else if (!nextTile) {
						++tileToBeMoved.targetPosition.y;
						++offset;
					}

					++k;
				}

				if (offset>0) {
					needToGenerateNewTile=true;
					tileToBeMoved.state="moving";
				}
			}
		}
	}

	updateScore();
	isCalculating=false;
}

function update() {
	if (state==="running") {
		if (!isCalculating) {
			//a csempéket alaphelyzetbe állítjuk
			for (y=0;y<4;y++){
				for (x=0;x<4;x++) {
					//akkor állítjuk alapállásba a HTML blokkot, ha
					//az adott pozícióhoz nem tartozik csempe, de a HTML blokknak van osztálya és tartalma
					if (!tiles.some(tile=>tile.startPosition.x===x && tile.startPosition.y===y)
						&& tileDivs[y*4+x].className.split(" ").some(c=>/tile-.*/.test(c))) {
						tileDivs[y*4+x].innerHTML = "";
						tileDivs[y*4+x].className = "tile";
					//vagy az adott pozícióhoz tartozik álló vagy mozgó csempe, de a HTML blokknak van 1-nél több csempe osztálya van
					} else if (tileDivs[y*4+x].className.split(" ").some(c=>/tile-.*/.test(c))
						&& tileDivs[y*4+x].className.match(/tile-[0-9]+/g).length>1
						&& tiles.some(tile=>tile.startPosition.x===x && tile.startPosition.y===y && tile.state==="standing")) {
							tileDivs[y*4+x].innerHTML = "";
							tileDivs[y*4+x].className = "tile";
					}
				}
			}

			tiles.forEach(tile=>{
				if (tile.state==="standing") {
					tileDivs[tile.startPosition.y*4+tile.startPosition.x].innerHTML=tile.value;
					tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.add("tile-"+tile.value);
				} else if (tile.state==="moving") {
					tileDivs[tile.startPosition.y*4+tile.startPosition.x].innerHTML=tile.value;
					tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.add("tile-"+tile.value);
					
					//ha a csempének mozognia kell balra
					if (tile.targetPosition.x<tile.startPosition.x) {
						//ha a csempe még nem tette meg a szükséges távolságot
						if (tile.left>(tile.targetPosition.x-tile.startPosition.x)*111) {
							tile.left-=TILE_SPEED;
							if (tile.left<(tile.targetPosition.x-tile.startPosition.x)*111) {
								tile.left = (tile.targetPosition.x-tile.startPosition.x)*111;
							}
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.left=tile.left+"px";
						//egyébként a csempének frissítjük az új kiinduló pozícióját
						} else {
							updateTileAfterMoving(tile);
						}
					//ha a csempének mozognia kell felfelé
					} else if (tile.targetPosition.y<tile.startPosition.y) {
						if (tile.top>(tile.targetPosition.y-tile.startPosition.y)*111) {
							tile.top-=TILE_SPEED;
							if (tile.top<(tile.targetPosition.y-tile.startPosition.y)*111) {
								tile.top = (tile.targetPosition.y-tile.startPosition.y)*111;
							}
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.top=tile.top+"px";
						} else {
							updateTileAfterMoving(tile);
						}
						//ha a csempének mozognia kell jobbra
					} else if (tile.targetPosition.x>tile.startPosition.x) {
						if (tile.left<(tile.targetPosition.x-tile.startPosition.x)*111) {
							tile.left+=TILE_SPEED;
							if (tile.left>(tile.targetPosition.x-tile.startPosition.x)*111) {
								tile.left = (tile.targetPosition.x-tile.startPosition.x)*111;
							}
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.left=tile.left+"px";
						} else {
							updateTileAfterMoving(tile);
						}
					//ha a csempének mozognia kell lefelé
					} else if (tile.targetPosition.y>tile.startPosition.y) {
						if (tile.top<(tile.targetPosition.y-tile.startPosition.y)*111) {
							tile.top+=TILE_SPEED;
							if (tile.top>(tile.targetPosition.y-tile.startPosition.y)*111) {
								tile.top = (tile.targetPosition.y-tile.startPosition.y)*111;
							}
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].style.top=tile.top+"px";
						} else {
							updateTileAfterMoving(tile);
						}
					}
				} else if (tile.state==="spawning") {
					if (tile.generatedAt===null) {
						tile.generatedAt=new Date();
						tileDivs[tile.startPosition.y*4+tile.startPosition.x].innerHTML=tile.value;
						tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.add("tile-"+tile.value,"spawning");
					} else if (tile.generatedAt!==undefined) {
						if (new Date().getTime()-tile.generatedAt.getTime()>SPAWNING_TIME) {
							tile.state="standing";
							tile.generatedAt=undefined;
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.remove("spawning");
							didYouWin();
							isGameOver();
						}
					}
				} else if (tile.state==="combining") {
					if (tile.combinedAt===null) {
						tile.combinedAt=new Date();
						tileDivs[tile.startPosition.y*4+tile.startPosition.x].innerHTML=tile.value;
						tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.add("tile-"+tile.value,"combining");
					} else if (tile.combinedAt!==undefined) {
						if (new Date().getTime()-tile.combinedAt.getTime()>COMBINING_TIME) {
							tile.state="standing";
							tile.combinedAt=undefined;
							tileDivs[tile.startPosition.y*4+tile.startPosition.x].classList.remove("combining");
						}
					}
				}
			})

			//ha mozgattuk a blokkokat és azok már bejezték a mozgást, akkor generálunk
			if (needToGenerateNewTile && isEveryTileStanding()) {
				generateNewTile();
			}
		}

		animationFrameID = requestAnimationFrame(update);
	}
}

function startGame() {
	/*tiles = [{value: 4,position: {x: 0,y: 3}},
	{value: 2,position: {x: 1,y: 3}},
	{value: 2,position: {x: 2,y: 3}}];*/
	/*tiles = [
	{value: 2,combiningValue: 2,startPosition: {x: 3,y: 0},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:0},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 3,y: 1},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:1},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 3,y: 2},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:2},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 3,y: 3},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:3},state:"standing"}]
	*//*
	tiles = [
	{value: 4,combiningValue: 4,startPosition: {x: 0,y: 0},top:0,left:0,right:0,bottom:0,targetPosition:{x:0,y:0},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 0,y: 1},top:0,left:0,right:0,bottom:0,targetPosition:{x:0,y:1},state:"standing"},
	{value: 4,combiningValue: 4,startPosition: {x: 0,y: 2},top:0,left:0,right:0,bottom:0,targetPosition:{x:0,y:2},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 0,y: 3},top:0,left:0,right:0,bottom:0,targetPosition:{x:0,y:3},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 1,y: 0},top:0,left:0,right:0,bottom:0,targetPosition:{x:1,y:0},state:"standing"},
	{value: 4,combiningValue: 4,startPosition: {x: 1,y: 1},top:0,left:0,right:0,bottom:0,targetPosition:{x:1,y:1},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 1,y: 2},top:0,left:0,right:0,bottom:0,targetPosition:{x:1,y:2},state:"standing"},
	{value: 4,combiningValue: 4,startPosition: {x: 1,y: 3},top:0,left:0,right:0,bottom:0,targetPosition:{x:1,y:3},state:"standing"},
	{value: 4,combiningValue: 4,startPosition: {x: 2,y: 0},top:0,left:0,right:0,bottom:0,targetPosition:{x:2,y:0},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 2,y: 1},top:0,left:0,right:0,bottom:0,targetPosition:{x:2,y:1},state:"standing"},
	{value: 4,combiningValue: 4,startPosition: {x: 2,y: 2},top:0,left:0,right:0,bottom:0,targetPosition:{x:2,y:2},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 2,y: 3},top:0,left:0,right:0,bottom:0,targetPosition:{x:2,y:3},state:"standing"},
	{value: 2,combiningValue: 2,startPosition: {x: 3,y: 0},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:0},state:"standing"},
	{value: 16,combiningValue: 16,startPosition: {x: 3,y: 1},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:1},state:"standing"},
	{value: 1024,combiningValue: 1024,startPosition: {x: 3,y: 2},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:2},state:"standing"},
	{value: 1024,combiningValue: 1024,startPosition: {x: 3,y: 3},top:0,left:0,right:0,bottom:0,targetPosition:{x:3,y:3},state:"standing"}]
	*/
	tiles=[];
	state="running";
	score=document.getElementById("score").innerHTML = 0;
	scoreIncrement=0;
	alreadyWon=false;
	needToGenerateNewTile=false;
	isCalculating=false;
	document.getElementById("game-over").style.display = "none";
	document.getElementById("you-win").style.display = "none";

	for (y=0;y<4;y++){
		for (x=0;x<4;x++) {
			tileDivs[y*4+x].innerHTML = "";
			tileDivs[y*4+x].className = "tile";
		}
	}

	for(i=0;i<2;i++){
		generateNewTile();
	}

	if (animationFrameID) cancelAnimationFrame(animationFrameID);
	animationFrameID = requestAnimationFrame(update);
}

startGame();