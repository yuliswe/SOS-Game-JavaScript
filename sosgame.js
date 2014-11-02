"use strict";
var DEBUG = true;
var debugList = [];
function debug(name, val, repeat, asset) {
    if (!DEBUG) {return;}
    var p;
    var text = (typeof val === 'undefined') ? (name+"; ") : (name+": "+val+"; ");
    if (debugList.indexOf(name) == -1 || repeat) {
        p = document.createElement("p");
        var t = document.createTextNode(text);
        p.id = 'debug_' + name;
        p.className = 'debug';
        p.appendChild(t);
        document.getElementsByTagName('body')[0].appendChild(p);
        debugList.push(name);
    } else {
        p = document.getElementById('debug_' + name);
        p.textContent = text;
    }
    if (typeof asset !== 'undefined' && asset !== val) {
        p.setAttribute('style','color: rgb(225,0,0)');
    }
    return val;
}

function loadSOSGame(canvasName) {
    /* Global Variables */
    var canvas = document.getElementById(canvasName);
    var ctx = canvas.getContext("2d");
    /* Helpers */
    function convasX(x) {return x - canvas.offsetLeft - canvas.scrollLeft;}
    function convasY(y) {return y - canvas.offsetTop - canvas.scrollTop;}
    function neg(OS) {return (OS == 'S' ? 'C' : 'S');}

    /* All Definitions */
    
    var GameLogic = new (function GameLogic() {
        
        /* Chessboard Class */
        function Chessboard(size) {
            
            var chessboard = [];
            this.currentOS = 0;
            this.size = size;
            // create a size x size chessboard;
            for (var i = 0; i < this.size; ++i) {
                chessboard.push([]);
                for (var j = 0; j < this.size; ++j) {
                    chessboard[i].push(' ');
                }
            }
            
            this.makeMove = function(x, y, OS) {chessboard[x][y] = OS;}
            this.isFull = function() {return this.currentOS === this.size;}
            this.block = function(bx, by) {};
            
        };
        
        this.startGame = function(size) {
            debug("GameLogic: startGame");
            this.chessboard = new Chessboard(size);
            // debug(this.chessboard.currentOS);
        }
        
        /* Player Subclass */
        // function Player(name, type) {
        //     this.name = name;        
                
        //     this.makeMove = function() {
        //         if (type === 'Human') {
        //             this.chessboard().makeMove(dx, dy, os);
        //         }
        //         if (this.chessboard().madeSOS)
        //     };
        //     this.madeSOS = function() {
                
        //     };
        // }
        
    });
        
    var GameDisplay = new (function GameDisplay() {
        
        /* Global Variables */
        var OSHeight = 100;
        var OSWidth = 50;
        var blkWidth = 2 * OSWidth;
        var blkHeight = OSHeight;
        var blocks = [];
        var FPS = 50;
        var OS_HOVER_TRANS = 1;
        var OS_DEHOVER_TRANS = 0.25;
        var OS_ORI_TRANS = 0;

        var clear = function() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
        };
        
        var draw = function() {
            debug("GameDisplay: draw")
            for (var i = 0; i < GameLogic.chessboard.size; i++) {
                for (var j = 0; j < GameLogic.chessboard.size; j++) {
                    // debug('bx'+i+j, blocks[i][j].bx, i); 
                    // debug('by'+i+j, blocks[i][j].by, j);
                    blocks[i][j].draw();
                }
            }
        };
        
        this.clear = clear;
        this.draw = draw;
        
        function Animate(target) {
            var interval;
            this.target = target;
            // debug(target);
            this.during = function(condf, func) {
                // debug(condf);
                // debug(this.target);
                return function(param) {
                    clearInterval(interval);
                    interval = setInterval(function() {
                        if (! condf(target, param)) {clearInterval(interval); return;}
                        // debug("Animate: run func(target))");
                        func(target);
                    }, 1000 / FPS);
                };
            };
        };
        
        function OS(x, y, os) {
            var animate = new Animate(this);
            var m_trans = OS_ORI_TRANS;
            this.trans = function(n) {
                if (typeof n === 'undefined') {return m_trans;}
                if (n > 1) {return m_trans = 1;}
                if (n < 0.1) {return m_trans = 0;}
                return m_trans = n;
            };
            this.width = OSWidth;
            this.height = OSHeight;
            this.x = x;
            this.y = y;
            this.os = os;
            this.draw = function() {
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.font = "20pt Arial";
                ctx.strokeStyle="rgba(0,0,0,"+this.trans()+")";
                var tx = this.x + OSWidth / 2;
                var ty = this.y + OSHeight / 2;
                ctx.strokeText(this.os, tx, ty);
                ctx.strokeStyle="#000";
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                // debug('x_'+x, this.x, 0); debug('y_'+y, this.y);
            };

            this.fadein = animate.during(function(obj, lim) {return obj.trans() <= lim}, 
                                         function(obj) {obj.trans(obj.trans()+0.2); debug("OS draw", obj.trans()); clear(); draw();});
            this.fadeout = animate.during(function(obj, lim) {return obj.trans() > lim;},
                                          function(obj) {obj.trans(obj.trans()-0.2); debug("OS draw", obj.trans()); clear(); draw();});
            this.fadeto = function(n) {(this.trans() < n) ? this.fadein(n) : this.fadeout(n);}
            // debug(this.fadein);
        }
        
        /* Subclass Block */
        function Block(bx, by) {
            this.width = blkWidth;
            this.height = blkHeight;
            this.x = bx * this.width;
            this.y = by * this.height;
            this.bx = bx;
            this.by = by;
            this.OS = false;
            this.animated = false;
            this.O = new OS(this.x, this.y, 'O');
            this.S = new OS(this.x + OSWidth, this.y, 'S');
            this.draw = function() {
                // ctx.textBaseline = 'top';
                // ctx.font = '12pt Aprial';
                // ctx.strokeText("bx = "+this.bx+' by = '+this.by, this.x, this.y);
                if (this.OS) {
                    ctx.font = '20pt Aprial';                    
                    ctx.strokeText(this.OS, this.x + blkWidth / 2, this.y + blkHeight / 2);
                } else {
                    this.O.draw();
                    this.S.draw();
                }
            };            
            this.dehover = function() {
                this.O.fadeout(0);
                this.S.fadeout(0);
            }
        };
                
        
        this.start = function() {    
            debug("GameDisplay: start");    
            this.chessboardRangeX = GameLogic.chessboard.size * OSWidth * 2;
            this.chessboardRangeY = GameLogic.chessboard.size * OSHeight;
            // create a size x size chessboard;
            for (var i = 0; i < GameLogic.chessboard.size; ++i) {
                blocks.push([]);
                for (var j = 0; j < GameLogic.chessboard.size; ++j) {
                    debug("push ", i+' '+j, true);
                    blocks[i].push(new Block(i, j));
                }
            }
            // debug("blocks[0][0].bx", blocks[0][0].bx, true, 0);
            // debug("blocks[0][0].by", blocks[0][0].by, true, 0);
            // debug("blocks[3][3].bx", blocks[3][3].bx, true, 3);
            // debug("blocks[3][3].by", blocks[3][3].by, true, 3);
        }
        
        
        this.hoverAnimation = function(bx, by, OS) {
            if (OS == 'S') {
                debug("hoverAnimation: call fadein on ", bx+' '+by+' '+'S');
                blocks[bx][by].S.fadein(OS_HOVER_TRANS);
                debug("hoverAnimation: call fadeout on ", bx+' '+by+' '+'O');
                blocks[bx][by].O.fadeto(OS_DEHOVER_TRANS);
            } else {
                debug("hoverAnimation: call fadein on ", bx+' '+by+' '+'O');
                blocks[bx][by].O.fadein(OS_HOVER_TRANS);
                debug("hoverAnimation: call fadeout on ", bx+' '+by+' '+'S');
                blocks[bx][by].S.fadeto(OS_DEHOVER_TRANS);
            }
        };
        
        this.dehoverAnimation = function(bx, by) {
            blocks[bx][by].dehover();
        }
        
        this.blockX = function(x) {
            if (x > this.chessboardRangeX) {return false;}
            return Math.floor(convasX(event.x) / blkWidth);
        };
        this.blockY = function(y) {
            if (y > this.chessboardRangeY) {return false;}
            return Math.floor(convasY(event.y) / blkHeight);
        };
        this.blockM = function(x, y) {
            if (x > this.chessboardRangeX || y > this.chessboardRangeY) {return false;}
            return convasX(event.x) / blkWidth % 1 > 0.5 ? "S" : "O";
        }; 
    });
    
    var GameControl = new (function GameControl() {        
        
        this.Player = function(name, type) {
            
            this.type = type;
    
            this.usrMove = function(callback) {
                var prevX = false;
                var prevY = false;
                var prevOS = false;
                
                canvas.addEventListener("mousemove", function(event) {
                    debug("GameControl: addEventListener: mousemove");
                    var bx = GameDisplay.blockX(event.x);
                    var by = GameDisplay.blockY(event.y);
                    var os = GameDisplay.blockM(event.x, event.y);
                    // debug('GameControl-onmousemove: bx',bx);
                    // debug('GameControl-onmousemove: by',by);
                    // debug('GameControl-onmousemove: os',os);
                    // debug('GameControl-onmousemove: prevX',prevX);
                    // debug('GameControl-onmousemove: prevY',prevY);
                    // debug('GameControl-onmousemove: prevOS',prevOS);
                    // debug(prevX !== bx || prevY !== by);
                    if (bx !== false && by !== false && (os !== prevOS || bx !== prevX || by !== prevY)) { // if the mouse is on a different O/S from last time, play hover animation // if mouse is in a chessboard block
                        debug("GameControl: call hoverAnimation on", bx+' '+by+' '+os);
                        GameDisplay.hoverAnimation(bx, by, os);
                    }
                    if (prevX !== false && prevY !== false && (prevX !== bx || prevY !== by)) { // if the block has changed, play dehover animations on the block
                        debug("GameControl: call dehoverAnimation on", prevX+' '+prevY+' '+prevOS);
                        GameDisplay.dehoverAnimation(prevX, prevY, prevOS);
                    };
                    prevOS = os;
                    prevX = bx;
                    prevY = by;
                });
                
                canvas.addEventListener("click", function(event) {
                    var bx = GameDisplay.blockX(event.x);
                    var by = GameDisplay.blockY(event.y);
                    var os = GameDisplay.blockM(event.x, event.y);
                    GameDisplay.clickAnimation(bx, by, os);
                    if (GameLogic.makeSOS(bx, by, os)) {}
                    GameLogic.player.makeMove(bx, by, os);
                    
                    canvas.removeEventListener("mousemove");
                    canvas.removeEventListener("click");
                    callback();
                });
            };
            
            this.cmpMove = function() {
            }
            
        }
            
    });


    /* Main */
    var A = new GameControl.Player("A", 'Human');
    var B = new GameControl.Player("B", 'Human');
    
    GameLogic.startGame(4);
    GameDisplay.start();
    // GameControl.init();
    GameDisplay.draw();
    
    (function callback() {
        debug("GameLogic.chessboard.isFull()", GameLogic.chessboard.isFull());
        if (GameLogic.chessboard.isFull()) {return;}
        if (A.type === 'Human') {
            (B.type === 'Human') ? A.usrMove(function() {B.usrMove(callback)}) : A.usrMove(function() {B.cmpMove(callback)});
        } else {
            A.cmpMove();
            (B.type === 'Human') ? B.usrMove(callback) : B.cmpMove(callback);
        }
    })();

}
