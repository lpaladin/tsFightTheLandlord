/*
 * Botzone 2.0 游戏播放器接口声明
 * 作者：zhouhy
 */

var infoProvider = {
	// 获得对局初始化数据
	getMatchInitData: function () {
		return parent.initdata;
	},
	// 获得所有log
	getLogList: function () {
		return JSON.parse(JSON.stringify(parent.loglist));
	},
	// 获得所有玩家名字数组
	getPlayerNames: function () {
		return parent.playerNames;
	},
	// 获得是否是实时对局
	isLive: function () {
		return parent.live;
	},
	// 获得当前玩家位置序号（-1表示回放/观战）
	getPlayerID: function () {
		return parent.playerSlotID;
	},
	// 传入回调函数原型：void fn(currentLog)（通常用于实时播放信息）
	setNewLogCallback: function (fn) {
		parent.callbacks.newlog = fn;
	},
	// 传入回调函数原型：void fn(currentLog)（提醒玩家当前是玩家回合）
	setNewRequestCallback: function (fn) {
		parent.callbacks.newrequest = fn;
	},
	// 传入回调函数原型：void fn(scores)（通常用于实时播放刚刚结束）
	setGameOverCallback: function (fn) {
		parent.callbacks.gameover = fn;
	},
	// 传入回调函数原型：void fn(historyLogs), 参数是数组，功能：一次跳到log末尾状态（通常用于后来的观看者）
	setReadHistoryCallback: function (fn) {
		parent.callbacks.readhistory = fn;
	},
	// 传入回调函数原型：void fn(currentLog), 参数是完整版单条log（通常只出现于回放）
	setReadFullLogCallback: function (fn) {
		parent.callbacks.readfulllog = fn;
	},
	// 传入回调函数原型：void fn(percentage), 参数是所跳转时间占总时间的比例
	setSeekCallback: function (fn) {
		parent.callbacks.seek = fn;
	},
	// 传入回调函数原型：void fn(percentage), 参数是所跳转时间占总时间的比例，该函数需要高效演算
	setSeekPreviewCallback: function (fn) {
		parent.callbacks.seekpreview = fn;
	},
	setPauseCallback: function (fn) {
		parent.callbacks.pause = fn;
	},
	setPlayCallback: function (fn) { // 发生于暂停后的继续
		parent.callbacks.play = fn;
	},
	setSize: function (width, height) { // 宽度无用、高度为最小值
		var iframe = window.frameElement;
		iframe.height = height;
		iframe.width = width;
	},
	// （可选）调用后可以隐藏载入遮罩
	notifyFinishedLoading: function () {
		if (parent.FormConfig.prototype.ldscreen)
			parent.FormConfig.prototype.ldscreen.fadeOut();
	},
	// 内部初始化结束后调用
	notifyInitComplete: function () {
		parent.notifications.initcomplete();
	},
	// 玩家下了一步
	notifyPlayerMove: function (move) {
		parent.notifications.playermove(move);
	},
	// 播放器想要暂停（不一定有效）
	notifyRequestPause: function () {
		return parent.notifications.requestpause();
	},
	// 播放器想要继续（不一定有效）
	notifyRequestResume: function () {
		return parent.notifications.requestresume();
	},
	v2: { // 2代接口，如果使用，则1代的所有 set 都不必理会
		// 如果需要让下一段动画在这段动画的中间就开始，那么
		// 返回的 TimelineMax 中需要有一个叫做 "insertPoint" 的标签
		// 表示下一段动画可以开始的位置
		// 请注意，构建 Timeline 的时候，from 系列需要设置 immediateRender: false

		// 最重要的接口，建议通过读取 display 处理大多数逻辑
		// 建议包括 游戏结束的处理、自己走出一步之后的变化
		// 传入回调函数原型：cb(display): TimelineMax
		setDisplayCallback: function (cb) {
			parent.callbacks.v2.display = cb;
			infoProvider.setNewLogCallback(null);
			infoProvider.setReadFullLogCallback(null);
			infoProvider.setReadHistoryCallback(null);
		},
		// 实时对局中，轮到自己的时候的处理
		// 非完全信息的游戏中，request 里有只能自己看到的信息
		// 传入回调函数原型：cb(request): TimelineMax
		setRequestCallback: function (cb) {
			parent.callbacks.v2.request = cb;
			infoProvider.setNewRequestCallback(null);
		},
		// 这里的分数是 Botzone 最真实的分数，
		// 不过对于游戏结束的处理建议通过分析 display 来进行
		// 传入回调函数原型：cb(scores): TimelineMax
		setGameOverCallback: function (cb) {
			parent.callbacks.v2.gameover = cb;
			infoProvider.setGameOverCallback(null);
		},
		// 设置展示区域最小高度和宽度，会影响手机端缩放决策
		setMinSize: function (width, height) {
			infoProvider.setSize(width, height);
		},
		// 传入一个函数，在全局 Timeline 进行渲染时调用
		setRenderTickCallback: function (cb) {
			parent.callbacks.render = cb;
		},
		// 内部初始化结束后调用，参数是可选的开场动画
		notifyInitComplete: function (initialTimeline) {
			parent.notifications.initcomplete(2, initialTimeline);
		},
		// 返回的一定要是【这个】TimelineMax new 出来的对象啊！
		TimelineMax: parent.TimelineMax,
		TweenMax: parent.TweenMax
	}
};