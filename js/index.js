var sw = 20,// width of a cube
    sh = 20,// height of a cube
    tr = 30, // num of rows
    td = 30; // num of columns

var snake = null,// 蛇的实例
    food = null,//食物实例
    game = null;


//方块的属性
function Square(x, y, classname) {
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;
    this.viewContent = document.createElement('div');// 方块对应的dom元素
    this.viewContent.className = this.class;
    this.parent = document.getElementById('snakeWrap');//方块的父级
}
Square.prototype.create = function () {
    this.viewContent.style.position = "absolute";
    this.viewContent.style.width = sw + "px";
    this.viewContent.style.height = sh + "px";
    this.viewContent.style.left = this.x + "px";
    this.viewContent.style.top = this.y + "px";

    this.parent.appendChild(this.viewContent);
}
Square.prototype.remove = function () {
    this.parent.removeChild(this.viewContent);
}

//蛇的属性

function Snake() {
    this.head = null;// 存储蛇头的信息
    this.tail = null;// 存储蛇尾的信息
    this.pos = [];// 存储蛇身上每个方块位置,二维数组

    this.directionNum = {//存储蛇走的方向，用一个对象来表示
        left: {
            x: -1,
            y: 0,
            rotate: 180
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90

        }
    }

}
//init初始化
Snake.prototype.init = function () {

    //创建蛇头
    var snakeHead = new Square(2, 0, "snakeHead");
    snakeHead.create();

    // 这里this指的蛇的实例
    this.head = snakeHead; // 更新存储蛇头的信息
    this.pos.push([2, 0]);

    // 创建蛇身体1
    var snakeBody1 = new Square(1, 0, "snakeBody");
    snakeBody1.create();
    this.pos.push([1, 0]); // 存储蛇身1的位置信息

    // 创建身体2
    var snakeBody2 = new Square(0, 0, "snakeBody");
    snakeBody2.create();
    this.tail = snakeBody2;//更新存储蛇尾信息
    this.pos.push([0, 0]);

    //形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    // 给蛇加一个属性，表示蛇走的方向
    this.direction = this.directionNum.right;// 默认向右

}

//获取蛇头下一个位置对应的元素，根据不同元素做不同事情
Snake.prototype.getNextPos = function () {

    //蛇头走到的下个点的坐标
    var nextPos = [

        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ]

    //下个点是自己，撞到自己，游戏结束
    var selfCollied = false;
    this.pos.forEach(
        function (value) {
            if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
                selfCollied = true;
            }
        });
    if (selfCollied) {
        console.log("zhuangle");

        this.strategies.die.call(this);
        return;
    }

    //下个点是围墙，游戏结束


    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        console.log("zhuangqiangle");
        this.strategies.die.call(this);
        return;
    }

    //下个点是苹果，吃
    if(food && food.pos[0] == nextPos[0]&&food.pos[1]==nextPos[1]){
        //如果该条件成立说明现在蛇头要走的下个点是食物
        this.strategies.eat.call(this);
        return;
    }

    //下个点什么都不是，走
    this.strategies.move.call(this);//改变this指向实例，方便下面
}

//碰撞后发生函数

Snake.prototype.strategies = {
    move: function (format) {//format参数决定删不删tail，传了该参数就是吃到食物
        //创建一个新身体在旧蛇头位置
        var newBody = new Square(this.head.x / sw, this.head.y / sh, "snakeBody");
        
        // 更新链表关系
        newBody.next = this.head.next;//snakeBody1取不到
        newBody.last = null;
        newBody.next.last = newBody;
        //把旧蛇头删掉
        this.head.remove();
        newBody.create();

        //创建新蛇头（nextPos）
        var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, "snakeHead")

        // 更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = `rotate(${this.direction.rotate}deg)`
        newHead.create();

        //更新蛇身上每个坐标位置pos[],最前面加一个newHead
        this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y])

        //更新this.head
        this.head = newHead;

        if (!format) {//format为 false或没传undefined 则需要删除旧tail

            //更新蛇尾
            this.tail.remove();
            this.tail = this.tail.last;

            // 更新pos数组，删掉最后一个
            this.pos.pop();
        }
    },
    eat: function () {
        this.strategies.move.call(this, true)//format为true
        createFood();
        game.score++;
    },
    die: function () {
        console.log("die");
        game.over();
        // this.head 这里的this指 this.strategies,谁调用die就指向谁，所以拿不到head
    }
}
snake = new Snake();


//创建食物
function createFood() {
    //食物随机坐标
    var x = null;
    var y = null;

    var include = true; //循环跳出的条件，true表示食物坐标在蛇身上，继续循环
    while (include) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        var condition = true;
        //食物不在蛇身上，可以跳出循环
        snake.pos.forEach(function (value) {

            if (condition && x != value[0] || y != value[1]) {
                include = false;
            }
            if (x == value[0] && y == value[1]) {
                include = true;
                //食物可能不在当前的value，但有可能在其他value，一旦include为true就不可再改变，但false还可变为true
                var condition = false;
            }
        })

    }
    //生成食物
    food = new Square(x, y, "food");
    food.pos = [x, y];//存储食物坐标，看跟蛇头下个位置是否一致

    var foodDom = document.querySelector(".food");

    //判断界面上是否有食物，有就改变位置，没有就生成
    if(foodDom){
        foodDom.style.left = x*sw+"px";
        foodDom.style.top = y*sh+"px";
    }else{
        food.create();
    }
    
}


//创建游戏逻辑
function Game() {

    this.timer = null;//计时器
    this.score = 0;
}

Game.prototype.init = function () {
    snake.init();
    createFood();
    //snake.getNextPos();

    document.onkeydown = function (ev) {
        //按下键盘左键
        if (ev.which == 37 && snake.direction != snake.directionNum.right) {
            snake.direction = snake.directionNum.left;
        } else if (ev.which == 38 && snake.direction != snake.directionNum.down) {
            snake.direction = snake.directionNum.up;
        } else if (ev.which == 39 && snake.direction != snake.directionNum.left) {
            snake.direction = snake.directionNum.right;
        } else if (ev.which == 40 && snake.direction != snake.directionNum.up) {
            snake.direction = snake.directionNum.down;
        }
    }
    this.start();
}
Game.prototype.start = function () {
    this.timer = setInterval(function () {
        snake.getNextPos();
    }, 200);
}

Game.prototype.over=function(){
    // 清除计时器
    clearInterval(this.timer);
   
    alert(`游戏结束，你的得分为:${game.score}`); 
    
    //游戏回到最初状态
    var snakeWrap = document.getElementById("snakeWrap");
    snakeWrap.innerHTML="";
    //新建实例
    snake = new Snake();
    game = new Game();
    var startBtnWrap = document.querySelector(".startBtn");
    startBtnWrap.style.display="block";

}
Game.prototype.pause = function(){
    clearInterval(this.timer);
}


//开始游戏
game = new Game();
var startBtn = document.querySelector(".startBtn button");
startBtn.onclick = function () {
    startBtn.parentNode.style.display = "none";
    game.init();
}


//暂停游戏
var snakeWrap = document.getElementById("snakeWrap");
var pauseBtn = document.querySelector(".pauseBtn button")
snakeWrap.onclick = function(){
    game.pause();
    pauseBtn.parentNode.style.display="block";

}
pauseBtn.onclick = function(){
    game.start();
    pauseBtn.parentNode.style.display="none";
}

