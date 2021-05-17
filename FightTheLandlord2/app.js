var Effects;
(function (Effects) {
    var controls = {
        common: null,
        uncommon: null,
        bomb: null,
        fly: null,
        prompt: null,
        sbomb: null,
        result: null,
        call: null
    };
    function init() {
        for (var id in controls)
            controls[id] = $("#" + id);
        controls.bomb.find(".text").text("炸弹").shatter();
        controls.sbomb.find(".text").text("火箭").shatter();
    }
    Effects.init = init;
    function fly(message) {
        var tl = new TimelineMax();
        tl.add(Util.biDirConstSet(controls.fly[0], "textContent", message));
        tl.fromTo(controls.fly, 0.7, { opacity: 0, xPercent: "-250" }, { opacity: 1, xPercent: "-50", ease: parent["Sine"].easeOut });
        tl.to(controls.fly, 0.7, { opacity: 0, xPercent: "150", ease: parent["Sine"].easeIn });
        return tl;
    }
    Effects.fly = fly;
    function sbomb() {
        var tl = new TimelineMax();
        var characters = controls.sbomb.find("> div > div");
        var bkg = controls.sbomb.find(".bkg");
        tl.fromTo(controls.sbomb, 0.3, { opacity: 0 }, { opacity: 1 });
        tl.fromTo(bkg, 0.3, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, immediateRender: false }, 0.5);
        tl.staggerFromTo(characters, 1, { opacity: 0, scale: 3, y: 0 }, { opacity: 1, scale: 1, ease: parent["Expo"].easeIn }, 0.15, 0);
        tl.to(characters, 1, { y: "-100", opacity: 0 });
        tl.to(controls.sbomb, 0.5, { opacity: 0 });
        return tl;
    }
    Effects.sbomb = sbomb;
    function bomb() {
        var tl = new TimelineMax();
        var characters = controls.bomb.find("> div > div");
        var bkg = controls.bomb.find(".bkg");
        tl.fromTo(controls.bomb, 0.3, { opacity: 0 }, { opacity: 1 });
        tl.fromTo(bkg, 0.3, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, immediateRender: false }, 0.5);
        tl.staggerFromTo(characters, 1, { opacity: 0, scale: 3 }, { opacity: 1, scale: 1, ease: parent["Expo"].easeIn }, 0.15, 0);
        tl.to(controls.bomb, 0.5, { opacity: 0 }, "+=1");
        return tl;
    }
    Effects.bomb = bomb;
    function uncommon(message) {
        var tl = new TimelineMax();
        tl.add(Util.biDirConstSet(controls.uncommon[0], "textContent", message));
        tl.fromTo(controls.uncommon, 0.3, { scale: 0, opacity: 1 }, { scale: 1, ease: parent["Back"].easeOut, immediateRender: false });
        tl.to(controls.uncommon, 0.5, { opacity: 0 }, "+=1");
        return tl;
    }
    Effects.uncommon = uncommon;
    function result(resultStr, message) {
        // 仅可调用一次
        var tl = new TimelineMax();
        var r = controls.result.find(".result").text(resultStr).shatter().find("> *");
        var m = controls.result.find(".reason").text(message).shatter().find("> *");
        tl.fromTo(controls.result, 0.3, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, ease: parent["Back"].easeOut });
        tl.staggerFrom(r, 0.3, { scale: 1.3, opacity: 0 }, 0.1);
        tl.staggerFrom(m, 0.2, { opacity: 0 }, 0.05);
        return tl;
    }
    Effects.result = result;
    function prompt(message) {
        var tl = new TimelineMax();
        tl.add(Util.biDirConstSet(controls.prompt[0], "textContent", message));
        tl.fromTo(controls.prompt, 0.3, { opacity: 0, yPercent: "100" }, { opacity: 1, yPercent: "0", ease: parent["Back"].easeOut });
        tl.to(controls.prompt, 0.5, { opacity: 0 }, "+=2");
        return tl;
    }
    Effects.prompt = prompt;
    function commonlyEffect(control, playerid, message) {
        var tl = new TimelineMax();
        tl.add(Util.biDirConstSet(control[0], "textContent", message));
        if (infoProvider.getPlayerID() >= 0)
            playerid -= infoProvider.getPlayerID();
        tl.fromTo(control, 0.3, {
            scale: 0.5,
            opacity: 0,
            x: Math.sin(Math.PI * 2 * playerid / 3) * GameElement.fieldRadius,
            y: Math.cos(Math.PI * 2 * playerid / 3) * GameElement.fieldRadius,
            xPercent: "-50",
            yPercent: "-50"
        }, {
            scale: 1,
            opacity: 1,
            x: Math.sin(Math.PI * 2 * playerid / 3) * GameElement.fieldRadius / 3,
            y: Math.cos(Math.PI * 2 * playerid / 3) * GameElement.fieldRadius / 3,
            xPercent: "-50",
            yPercent: "-50"
        });
        tl.to(control, 0.3, {
            scale: 1.5,
            opacity: 0,
            x: 0,
            y: 0,
            xPercent: "-50",
            yPercent: "-50"
        }, "+=1");
        return tl;
    }
    function common(playerid, message) {
        return commonlyEffect(controls.common, playerid, message);
    }
    Effects.common = common;
    function call(playerid, message) {
        return commonlyEffect(controls.call, playerid, message);
    }
    Effects.call = call;
})(Effects || (Effects = {}));
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var GameElement;
(function (GameElement) {
    GameElement.playerTitles = [
        "地主", "农民甲", "农民乙"
    ];
    GameElement.calls = [
        "不叫", "叫1分", "叫2分", "叫3分"
    ];
    var cardHeight;
    var cardWidth;
    var cardGap;
    // 满手牌的弧度是多少
    var arcRad;
    // 19d（最多20张牌，19个间隔） = arcRad * r
    var virtualRadius;
    var gapRad;
    var mouseDownForBatchSelect;
    var zIndexMax = 1000;
    GameElement.finalizeCallback = requestAnimationFrame.bind(window);
    function initializeLayout() {
        var realH;
        if (window.innerWidth / window.innerHeight > Math.SQRT2)
            realH = window.innerHeight;
        else
            realH = window.innerWidth * Math.SQRT1_2;
        cardHeight = realH * 0.15;
        cardWidth = cardHeight * 0.75;
        cardGap = cardWidth * 0.3;
        // 满手牌的弧度是多少
        arcRad = Math.PI / 8;
        // 19d（最多20张牌，19个间隔） = arcRad * r
        virtualRadius = 19 * cardGap / arcRad;
        gapRad = arcRad / 19;
        GameElement.fieldRadius = (realH - cardHeight * 2) * 0.5;
    }
    GameElement.initializeLayout = initializeLayout;
    var Player = /** @class */ (function () {
        function Player(playerid) {
            var _this = this;
            this.playerid = playerid;
            this.deckCards = [];
            this.playedCards = [];
            this.disposedCards = [];
            this.controls = {
                info: null,
                deckLeft: null,
                submit: null,
                pass: null,
                title: null,
                avatar: null,
                nick: null,
                error: null,
                call0: null,
                call1: null,
                call2: null,
                call3: null
            };
            this._enabled = false;
            this.deckLastLength = 0;
            this.nextTickUpdate = false;
            this.$visual = $(Util.insertTemplate("player"));
            for (var id in this.controls) {
                var ctrl = this.controls[id] = this.$visual.find("[data-id=\"" + id + "\"]");
                if (ctrl.hasClass("value"))
                    ctrl.addNumberHandle();
            }
            this.controls.submit.click(function () {
                var selected = _this.deckCards.filter(function (c) { return c.selected; });
                if (selected.length === 0)
                    game.trySubmit(null);
                else if (game.trySubmit(selected))
                    _this.enabled = false;
            });
            this.controls.pass.click(function () {
                if (game.trySubmit([]))
                    _this.enabled = false;
            });
            var _loop_1 = function (i) {
                this_1.controls["call" + i].click(function () {
                    game.callBid(i);
                    _this.callEnabled = false;
                });
            };
            var this_1 = this;
            for (var i = 0; i < 4; i++) {
                _loop_1(i);
            }
            if (infoProvider.getPlayerNames())
                this.controls.nick.text(infoProvider.getPlayerNames()[playerid].name);
            this.updateTitle(undefined);
        }
        Player.prototype.updateTitle = function (landlord) {
            var to = landlord === undefined ? (this.playerid + 1) + "号玩家" : GameElement.playerTitles[(this.playerid + 3 - landlord) % 3];
            if (GameElement.tl) {
                GameElement.tl.add(Util.biDirConstSet(this.controls.title, "textContent", to));
                if (landlord === this.playerid)
                    GameElement.tl.set(this.$visual, { className: "+=landlord" });
            }
            else {
                this.controls.title.text(to);
                if (landlord === this.playerid)
                    this.$visual.addClass("landlord");
            }
        };
        Player.prototype.clearBuffer = function () {
            // 清空上次自己出的牌
            Util.cat(this.disposedCards, this.playedCards);
            this.playedCards.length = 0;
            this.update();
        };
        Player.prototype.bringToTop = function () {
            if (GameElement.tl)
                GameElement.tl.add(Util.biDirConstSet(this.$visual[0], "zIndex", zIndexMax++), GameElement.tlHead);
            else
                this.$visual.css("zIndex", zIndexMax++);
        };
        Player.prototype.playCard = function (cards) {
            for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
                var c = cards_1[_i];
                for (var i = 0; i < this.deckCards.length; i++)
                    if (this.deckCards[i].cardid === c) {
                        var card = this.deckCards.splice(i, 1)[0];
                        card.revealed = true;
                        this.playedCards.push(card);
                    }
            }
            this.bringToTop();
            this.update();
            return this.playedCards;
        };
        Object.defineProperty(Player.prototype, "minBid", {
            set: function (to) {
                for (var i = 1; i < 4; i++) {
                    this.controls["call" + i][i < to ? "hide" : "show"]();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "active", {
            get: function () { return this.$visual.hasClass("active"); },
            set: function (to) {
                if (to) {
                    this.$visual.addClass("active");
                    Util.PlayerTurnLog(__makeTemplateObject(["", "\u7684\u56DE\u5408"], ["", "\u7684\u56DE\u5408"]), this);
                }
                else
                    this.$visual.removeClass("active");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "errored", {
            get: function () { return this.$visual.hasClass("errored") && this.controls.error.text(); },
            set: function (to) {
                if (!!to == this.$visual.hasClass("errored")) {
                    return;
                }
                if (to) {
                    this.$visual.addClass("errored");
                    this.controls.error.text(to);
                    Util.Log(__makeTemplateObject(["", "\u7531\u4E8E", "\u800C\u9000\u573A\u5E76\u88AB\u6258\u7BA1"], ["", "\u7531\u4E8E", "\u800C\u9000\u573A\u5E76\u88AB\u6258\u7BA1"]), this, to);
                }
                else
                    this.$visual.removeClass("errored");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "visible", {
            get: function () { return this.$visual.hasClass("visible"); },
            set: function (to) {
                if (to)
                    this.$visual.addClass("visible");
                else
                    this.$visual.removeClass("visible");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "callEnabled", {
            get: function () { return this.$visual.hasClass("call-enabled"); },
            set: function (to) {
                if (to)
                    this.$visual.addClass("call-enabled");
                else
                    this.$visual.removeClass("call-enabled");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "enabled", {
            get: function () { return this._enabled; },
            set: function (to) {
                var _this = this;
                if (this._enabled === to)
                    return;
                this._enabled = to;
                if (to) {
                    this.$visual.addClass("enabled");
                    $(document).on("mousemove", function (e) {
                        if (!_this.enabled)
                            return;
                        var ratio = (e.pageX - _this.left) / _this.width;
                        if (ratio < 0 || ratio > 1)
                            return;
                        for (var i = 0; i < _this.deckCards.length; i++)
                            _this.deckCards[i].requestedScale = Math.cos(ratio - i / _this.deckCards.length);
                    }).on("mouseup", function (e) { return mouseDownForBatchSelect = undefined; });
                }
                else {
                    this.$visual.removeClass("enabled");
                    $(document).off("mousemove mouseup");
                }
                mouseDownForBatchSelect = undefined;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.addCard = function (card) {
            var i;
            if (!card.revealed) {
                for (i = 0; i < this.deckCards.length; i++)
                    if (!this.deckCards[i].revealed &&
                        this.deckCards[i].cardid > card.cardid) {
                        this.deckCards.splice(i, 0, card);
                        break;
                    }
                if (i === this.deckCards.length)
                    this.deckCards.push(card);
            }
            else
                this.deckCards.unshift(card);
            this.$visual.append(card.$visual);
            this.update();
        };
        Player.prototype.update = function (force) {
            var _this = this;
            if (force === void 0) { force = false; }
            if (!this.nextTickUpdate) {
                this.nextTickUpdate = true;
                GameElement.finalizeCallback(function () {
                    _this.nextTickUpdate = false;
                    for (var i = 0; i < _this.deckCards.length; i++) {
                        _this.deckCards[i].nth = i;
                        _this.deckCards[i].total = _this.deckCards.length;
                        _this.deckCards[i].enabled = _this.enabled;
                        _this.deckCards[i].isInDeck = true;
                        if (force)
                            _this.deckCards[i].updateTransform();
                    }
                    for (var i = 0; i < _this.playedCards.length; i++) {
                        _this.playedCards[i].nth = i;
                        _this.playedCards[i].total = _this.playedCards.length;
                        _this.playedCards[i].enabled = false;
                        _this.playedCards[i].isInDeck = false;
                        if (force)
                            _this.playedCards[i].updateTransform();
                    }
                    for (var _i = 0, _a = _this.disposedCards; _i < _a.length; _i++) {
                        var c = _a[_i];
                        c.visible = false;
                        if (force)
                            c.updateTransform();
                    }
                    if (_this.deckLastLength !== _this.deckCards.length) {
                        if (GameElement.tl)
                            GameElement.tl.add(Util.tweenContentAsNumber(_this.controls.deckLeft, _this.deckCards.length), GameElement.tlHead);
                        else
                            Util.tweenContentAsNumber(_this.controls.deckLeft, _this.deckCards.length);
                        _this.deckLastLength = _this.deckCards.length;
                    }
                    var halfFullRad = gapRad * (_this.deckCards.length - 1) / 2;
                    _this.width = 2 * Math.sin(halfFullRad) * virtualRadius +
                        cardWidth;
                    var targetProps = {
                        xPercent: "-50",
                        yPercent: "-50",
                        y: GameElement.fieldRadius,
                        width: _this.width,
                        height: cardHeight + (1 - Math.cos(halfFullRad)) * virtualRadius
                    };
                    targetProps.width = virtualRadius;
                    TweenMax.set(_this.controls.info, targetProps);
                    _this.left = _this.$visual.offset().left - _this.width / 2;
                });
            }
        };
        return Player;
    }());
    GameElement.Player = Player;
    var Card = /** @class */ (function () {
        function Card(cardid) {
            this.cardid = cardid;
            this._isInDeck = true;
            this._requestedScale = 1;
            this._enabled = false;
            this._visible = true;
            this.isLeavingDeck = false;
            this.nextTickUpdate = false;
            if (cardid < 52) {
                this.card = [Logic.SUITS[cardid % 4], Logic.POINTS[Math.floor(cardid / 4)]];
                this.name = Logic.POINTS[Math.floor(cardid / 4)].toUpperCase();
            }
            else {
                this.card = [cardid === 53 ? "h" : "s", "o"];
                this.name = cardid === 53 ? "大王" : "小王";
            }
            this.lastCardHeight = cardHeight;
            this.$visual = $('<figure class="card"></figure>');
            this.$visual.css("zIndex", cardid);
            this.resetVisual();
        }
        Card.get = function (cardid) {
            return Card.allCards[cardid] = Card.allCards[cardid] || new Card(cardid);
        };
        Card.prototype.updateTransform = function () {
            var _this = this;
            if (!this.nextTickUpdate) {
                this.nextTickUpdate = true;
                GameElement.finalizeCallback(function () {
                    _this.nextTickUpdate = false;
                    if (_this.lastCardHeight !== cardHeight) {
                        _this.resetVisual();
                        _this.lastCardHeight = cardHeight;
                    }
                    if (GameElement.tl)
                        GameElement.tl.add(Util.biDirConstSet(_this.$visual[0], "zIndex", (_this.nth || 0) + 1), GameElement.tlHead);
                    else
                        _this.$visual.css("zIndex", _this.nth + 1);
                    var targetProps = {};
                    if (_this.visible) {
                        if (!GameElement.tl)
                            TweenMax.set(_this.$visual, { scale: _this.enabled ? _this.requestedScale : 1 });
                        if (_this.isLeavingDeck) {
                            var param = {
                                scale: 1.3,
                                yoyo: true,
                                repeat: 1,
                                ease: parent["Expo"].easeOut
                            };
                            if (GameElement.tl) {
                                GameElement.tl.set(_this.$visual, { className: "+=played" }, GameElement.tlHead);
                                GameElement.tl.fromTo(_this.$visual, GameElement.tlTime, { scale: 1 }, param, GameElement.tlHead);
                                GameElement.tl.add(Util.shake(1, "#container", 0.02), GameElement.tlHead + GameElement.tlTime * 2);
                            }
                            else {
                                _this.$visual.addClass("played");
                                param.onComplete = function () { return Util.shake(0.5, "#container", 0.02); };
                                TweenMax.fromTo(_this.$visual, 0.2, { scale: 1 }, param);
                            }
                        }
                        _this.isLeavingDeck = false;
                        var rad = gapRad * (_this.nth - (_this.total - 1) / 2);
                        targetProps = {
                            rotation: rad / Math.PI * 180,
                            x: virtualRadius * Math.sin(rad),
                            y: (_this.isInDeck ? GameElement.fieldRadius : 0) +
                                virtualRadius * (1 - Math.cos(rad)),
                            xPercent: "-50",
                            yPercent: "-50",
                            opacity: 1
                        };
                    }
                    else
                        targetProps = {
                            opacity: 0
                        };
                    if (GameElement.tl)
                        GameElement.tl.to(_this.$visual, GameElement.tlTime, targetProps, GameElement.tlHead);
                    else
                        TweenMax.to(_this.$visual, 0.2, targetProps);
                });
            }
        };
        Card.prototype.resetVisual = function () {
            this.$visual.html("");
            this.$visual.append(Poker.getCardImage(cardHeight, this.card[0], this.card[1]));
            this.$visual.append(Poker.getBackImage(cardHeight));
            this.$visual.css({
                borderRadius: cardHeight / 12.5,
                width: cardWidth,
                height: cardHeight
            });
            this.$visual.find("img").prop("draggable", false);
        };
        Object.defineProperty(Card.prototype, "nth", {
            get: function () { return this._nth; },
            set: function (to) {
                if (this._nth === to)
                    return;
                this._nth = to;
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "total", {
            get: function () { return this._total; },
            set: function (to) {
                if (this._total === to)
                    return;
                this._total = to;
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "publicCard", {
            get: function () { return this.$visual.hasClass("public-card"); },
            set: function (to) {
                if (to) {
                    this.$visual.addClass("public-card");
                    TweenMax.set(this.$visual, { opacity: 0 });
                }
                else
                    this.$visual.removeClass("public-card");
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "revealed", {
            get: function () { return this.$visual.hasClass("revealed"); },
            set: function (to) {
                if (to)
                    this.$visual.addClass("revealed");
                else
                    this.$visual.removeClass("revealed");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "enabled", {
            get: function () { return this._enabled; },
            set: function (to) {
                var _this = this;
                if (this._enabled === to)
                    return;
                this._enabled = to;
                if (!to) {
                    this.$visual.removeClass("selected");
                    this.$visual.off("mousemove mouseup mousedown");
                }
                else
                    this.$visual.mousedown(function (e) {
                        mouseDownForBatchSelect = !_this.$visual.hasClass("selected");
                        _this.$visual.toggleClass("selected");
                    }).mousemove(function (e) {
                        if (mouseDownForBatchSelect === true)
                            _this.$visual.addClass("selected");
                        else if (mouseDownForBatchSelect === false)
                            _this.$visual.removeClass("selected");
                    }).mouseup(function (e) { return mouseDownForBatchSelect = undefined; });
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "visible", {
            get: function () { return this._visible; },
            set: function (to) {
                if (this._visible === to)
                    return;
                this._visible = to;
                if (!to)
                    this.enabled = false;
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "requestedScale", {
            get: function () { return this._requestedScale; },
            set: function (to) {
                if (this._requestedScale === to)
                    return;
                this._requestedScale = to;
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "isInDeck", {
            get: function () { return this._isInDeck; },
            set: function (to) {
                if (this._isInDeck === to)
                    return;
                this._isInDeck = to;
                if (!to)
                    this.isLeavingDeck = true;
                this.updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Card.prototype, "selected", {
            get: function () { return this.$visual.hasClass("selected"); },
            set: function (to) {
                if (to)
                    this.$visual.addClass("selected");
                else
                    this.$visual.removeClass("selected");
            },
            enumerable: true,
            configurable: true
        });
        Card.MAX_CARD_ID = 54;
        Card.allCards = new Array(Card.MAX_CARD_ID);
        return Card;
    }());
    GameElement.Card = Card;
    var Memo = /** @class */ (function () {
        function Memo() {
            this.nameToCounter = {};
            this.visual = document.getElementById("memo");
            for (var i = 0; i < Card.MAX_CARD_ID; i++) {
                var card = Card.get(i);
                if (card.card[0] == 'h' || i >= 52) {
                    var h = document.createElement('div');
                    h.className = "name";
                    h.textContent = card.name;
                    var v = document.createElement('td');
                    v.className = "count";
                    v.textContent = "4";
                    h.appendChild(v);
                    this.nameToCounter[card.name] = v;
                    this.visual.appendChild(h);
                    if (this.visual.childElementCount == 8) {
                        this.visual.appendChild(document.createElement('br'));
                    }
                }
            }
        }
        Memo.prototype.update = function () {
            var nameToCount = {};
            for (var i = 0; i < Card.MAX_CARD_ID; i++) {
                var card = Card.get(i);
                if (!card.revealed && card.$visual.closest(".visible").length == 0) {
                    nameToCount[card.name] = (nameToCount[card.name] || 0) + 1;
                }
            }
            if (Object.keys(nameToCount).length == 0) {
                this.visible = false;
                return;
            }
            for (var _i = 0, _a = Object.keys(this.nameToCounter); _i < _a.length; _i++) {
                var k = _a[_i];
                this.nameToCounter[k].textContent = (nameToCount[k] || 0).toString();
                if (nameToCount[k] == 4) {
                    this.nameToCounter[k].className = "count full";
                }
                else if (!nameToCount[k]) {
                    this.nameToCounter[k].className = "count empty";
                }
            }
        };
        Object.defineProperty(Memo.prototype, "visible", {
            set: function (to) {
                this.visual.style.display = to ? "inherit" : "none";
            },
            enumerable: true,
            configurable: true
        });
        return Memo;
    }());
    GameElement.Memo = Memo;
})(GameElement || (GameElement = {}));
// TODO：tweencontentasnumber在页面ajaxload回来后会出现鬼畜的效果……
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.landlord = undefined;
        this.publiccards = undefined;
        this.bidCalled = [false, false, false];
        this.allocationReceived = false;
        this.controls = {
            container: null,
        };
        this.pending = [];
        this.passStreak = 0;
        // $(window).resize(this.visualInitialization.bind(this));
        if (parent !== window) {
            window["TweenMax"] = infoProvider.v2.TweenMax;
            window["TimelineMax"] = infoProvider.v2.TimelineMax;
            this.prepareTL(0, 0.2);
            infoProvider.v2.setMinSize(0, 550);
        }
        this.players = [0, 1, 2].map(function (id) { return new GameElement.Player(id); });
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            $("#container").append(p.$visual);
        }
        this.visualInitialization();
        if (parent !== window) {
            if (infoProvider.isLive() && infoProvider.getPlayerID() >= 0) {
                this.players[infoProvider.getPlayerID()].visible = true;
                this.controls.container.addClass("curr-" + infoProvider.getPlayerID());
                if (infoProvider.getPlayerID() === 1)
                    TweenMax.set(this.controls.container, { rotation: 120 });
                else if (infoProvider.getPlayerID() === 2)
                    TweenMax.set(this.controls.container, { rotation: -120 });
            }
            else {
                this.controls.container.addClass("curr-0");
                for (var _b = 0, _c = this.players; _b < _c.length; _b++) {
                    var p = _c[_b];
                    p.visible = true;
                }
            }
            var tl = this.finalizeTL();
            infoProvider.v2.setRequestCallback(function (req) {
                if ("bid" in req) {
                    _this.players[infoProvider.getPlayerID()].minBid = Math.max.apply(Math, req.bid) + 1;
                    _this.players[infoProvider.getPlayerID()].callEnabled = true;
                }
                else {
                    _this.players[infoProvider.getPlayerID()].enabled = true;
                }
                return null;
            });
            infoProvider.v2.setDisplayCallback(this.parseLog.bind(this));
            infoProvider.v2.setGameOverCallback(function (scores) {
                for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                    var p = _a[_i];
                    p.visible = true;
                    p.enabled = false;
                }
                _this.memo.update();
                return null;
            });
            infoProvider.v2.notifyInitComplete(tl);
        }
        else {
            for (var _d = 0, _e = this.players; _d < _e.length; _d++) {
                var p = _e[_d];
                TweenMax.fromTo(p.controls.info, 0.4, { opacity: 0 }, { opacity: 1 });
            }
            infoProvider.notifyPlayerMove = function (cards) {
                _this.lastValidCombo = new Logic.CardCombo(_this.players[0].playCard(cards).map(function (c) { return c.card; }));
                Util.randomSelect([
                    function () { return Effects.fly("飞机带XX"); },
                    function () { return Effects.bomb(); },
                    function () { return Effects.sbomb(); },
                    function () { return Effects.uncommon("顺子"); },
                    function () { return Effects.common(0, "常见"); }
                ])();
                setTimeout(function () { return _this.players[0].enabled = _this.players[0].visible = true; }, 1000);
            };
            var j = 0;
            for (var _f = 0, _g = this.players; _f < _g.length; _f++) {
                var p = _g[_f];
                for (var i = 0; i < 17; i++) {
                    var card = GameElement.Card.get(j++);
                    if (j > 48)
                        card.revealed = true;
                    p.addCard(card);
                }
            }
            this.players[0].enabled = this.players[0].visible = true;
        }
        this.memo = new GameElement.Memo();
        this.memo.update();
    }
    Game.prototype.parseLog = function (display) {
        var _this = this;
        var checkError = function () {
            if ("errored" in display) {
                display.errored.forEach(function (error, i) {
                    if (error && _this.players[i].errored !== error) {
                        GameElement.tl.add(Util.biDirConstSet(_this.players[i], "errored", Util.translateError[error]));
                    }
                });
            }
        };
        if ("0" in display && "errored" in display && display.errored.every(function (x) { return x; })) {
            this.prepareTL();
            checkError();
            for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
                var p = _a[_i];
                GameElement.tl.add(Util.biDirConstSet(p, "active", (this.lastPlayer + 1) % 3 === p.playerid));
            }
            this.addToTL(Effects.result("游戏终止", "所有玩家出错，均获得 -1 分"));
            return this.finalizeTL();
        }
        if ("event" in display) {
            this.prepareTL();
            checkError();
            if (display.event.player === -1)
                display.event.player = 0;
            this.lastPlayer = display.event.player;
            for (var _b = 0, _c = this.players; _b < _c.length; _b++) {
                var p = _c[_b];
                GameElement.tl.add(Util.biDirConstSet(p, "active", p.playerid === display.event.player));
            }
            if (display.event.action.length > 0) {
                var cardEntities = this.players[display.event.player].playCard(display.event.action);
                var names_1 = cardEntities.map(function (c) { return c.name; }).join(' ');
                var cards = cardEntities.map(function (c) { return c.card; });
                if (cards.length > 0) {
                    var combo_1 = new Logic.CardCombo(cards);
                    if (combo_1.comboInfo) {
                        this.passStreak = 0;
                        this.lastValidCombo = combo_1;
                        switch (combo_1.comboInfo.type) {
                            case "炸弹":
                                this.addToTL(Effects.bomb());
                                break;
                            case "火箭":
                                this.addToTL(Effects.sbomb());
                                break;
                            case "单顺":
                            case "双顺":
                                this.addToTL(Effects.uncommon(combo_1.comboInfo.type));
                                break;
                            case "航天飞机":
                            case "航天飞机带小翼":
                            case "航天飞机带大翼":
                            case "飞机":
                            case "飞机带小翼":
                            case "飞机带大翼":
                                this.addToTL(Effects.fly(combo_1.comboInfo.type));
                                break;
                            default:
                                this.addToTL(Effects.common(display.event.player, combo_1.comboInfo.type));
                        }
                        this.tlCall(function () { return Util.PlayerActionLog(__makeTemplateObject(["", "\u6253\u51FA\u4E86", "(", ")"], ["", "\u6253\u51FA\u4E86", "(", ")"]), _this.players[display.event.player], names_1, combo_1.comboInfo.type); });
                    }
                }
            }
            else {
                this.addToTL(Effects.common(display.event.player, "过"));
                this.passStreak++;
                if (this.passStreak === 2)
                    this.lastValidCombo = undefined;
                this.tlCall(function () { return Util.PlayerActionLog(__makeTemplateObject(["", "", "\u4E86"], ["", "", "\u4E86"]), _this.players[display.event.player], "过"); });
            }
            this.players[(display.event.player + 1) % 3].clearBuffer();
            if ("0" in display) {
                var landlordScore = display[this.landlord];
                var farmerScore = display[(this.landlord + 1) % 3];
                var err = Util.translateError[display.errorInfo];
                if (err)
                    err = this.players[display.event.player].controls.title.text() + err;
                else
                    err = "游戏结束，" + (landlordScore > farmerScore ? "\u5730\u4E3B\u4ECE\u519C\u6C11\u5904\u8D62\u5F97 " + landlordScore + " \u5206" : "\u6BCF\u4E2A\u519C\u6C11\u4ECE\u5730\u4E3B\u5904\u8D62\u5F97 " + farmerScore + " \u5206");
                GameElement.tl.add(Effects.result(landlordScore > farmerScore ? "地主胜利" : "农民胜利", err));
            }
            this.memo && this.memo.update();
            return this.finalizeTL();
        }
        else if ("allocation" in display && !this.allocationReceived) {
            this.allocationReceived = true;
            this.prepareTL(0);
            checkError();
            for (var i = 0; i < this.players.length; i++)
                for (var _d = 0, _e = display.allocation[i]; _d < _e.length; _d++) {
                    var card = _e[_d];
                    this.players[i].addCard(GameElement.Card.get(card));
                }
            this.publiccards = display.publiccard;
            var currTL = this.finalizeTL();
            for (var _f = 0, _g = this.players; _f < _g.length; _f++) {
                var p = _g[_f];
                currTL.fromTo(p.controls.info, 0.4, { opacity: 0 }, { opacity: 1 });
            }
            return currTL;
        }
        else if ("landlord" in display && this.landlord === undefined) {
            this.prepareTL();
            checkError();
            this.showBidEffect(display.bid);
            GameElement.tlHead = 1.6;
            this.landlord = display.landlord;
            for (var i = 0; i < this.players.length; i++)
                this.players[i].updateTitle(display.landlord);
            for (var _h = 0, _j = this.publiccards; _h < _j.length; _h++) {
                var publiccard = _j[_h];
                var c = GameElement.Card.get(publiccard);
                this.players[this.landlord].addCard(c);
                c.publicCard = true;
                if (infoProvider.getPlayerID() !== this.landlord)
                    c.revealed = true;
            }
            this.memo && this.memo.update();
            return this.finalizeTL();
        }
        else if ("bid" in display) {
            this.prepareTL();
            checkError();
            this.showBidEffect(display.bid);
            return this.finalizeTL();
        }
    };
    Game.prototype.showBidEffect = function (bid) {
        var _this = this;
        var idx = bid.length - 1;
        if (!this.bidCalled[idx]) {
            this.bidCalled[idx] = true;
            this.lastPlayer = idx;
            for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
                var p = _a[_i];
                GameElement.tl.add(Util.biDirConstSet(p, "active", p.playerid === idx));
            }
            this.addToTL(Effects.call(idx, GameElement.calls[bid[idx]]));
            this.tlCall(function () {
                if (idx == 0) {
                    Util.Bid(__makeTemplateObject(["", "", ""], ["", "", ""]), _this.players[0], GameElement.calls[bid[0]]);
                }
                else if (idx == 1) {
                    Util.Bid(__makeTemplateObject(["", "", "\uFF1B", "", ""], ["", "", "\uFF1B", "", ""]), _this.players[0], GameElement.calls[bid[0]], _this.players[1], GameElement.calls[bid[1]]);
                }
                else {
                    Util.Bid(__makeTemplateObject(["", "", "\uFF1B", "", "\uFF1B", "", ""], ["", "", "\uFF1B", "", "\uFF1B", "", ""]), _this.players[0], GameElement.calls[bid[0]], _this.players[1], GameElement.calls[bid[1]], _this.players[2], GameElement.calls[bid[2]]);
                }
            });
        }
    };
    Game.prototype.callBid = function (bid) {
        infoProvider.notifyPlayerMove(bid);
    };
    Game.prototype.trySubmit = function (cards) {
        if (!cards) {
            // 试图自动匹配
            if (!this.lastValidCombo) {
                Effects.prompt("无须跟牌");
                return false;
            }
            var deckCards = this.players[infoProvider.getPlayerID() || 0].deckCards;
            var cmb = this.lastValidCombo.findFirstValid(deckCards.map(function (c) { return c.card; }));
            if (!cmb) {
                Effects.prompt("无法跟牌");
                return false;
            }
            for (var _i = 0, deckCards_1 = deckCards; _i < deckCards_1.length; _i++) {
                var c = deckCards_1[_i];
                c.selected = false;
                for (var _a = 0, _b = cmb.cards; _a < _b.length; _a++) {
                    var dc = _b[_a];
                    if (c.card[0] === dc[0] && c.card[1] === dc[1]) {
                        c.selected = true;
                        break;
                    }
                }
            }
            return false;
        }
        if (cards.length === 0) {
            if (!this.lastValidCombo) {
                Effects.prompt("必须出牌");
                return false;
            }
            infoProvider.notifyPlayerMove([]);
            // this.parseLog({ event: { player: infoProvider.getPlayerID(), action: [] }});
            return true;
        }
        var newCombo = new Logic.CardCombo(cards.map(function (c) { return c.card; }));
        if (!newCombo.comboInfo) {
            Effects.prompt("不存在该牌型");
            return false;
        }
        if (this.lastValidCombo && !this.lastValidCombo.canBeBeatenBy(newCombo)) {
            if (this.lastValidCombo.comboInfo &&
                this.lastValidCombo.comboInfo.type !== newCombo.comboInfo.type)
                Effects.prompt("\u724C\u578B" + newCombo.comboInfo.type + "\u4E0D\u80FD\u6253" + this.lastValidCombo.comboInfo.type);
            else if (this.lastValidCombo.comboInfo &&
                this.lastValidCombo.comboInfo.len !== newCombo.comboInfo.len)
                Effects.prompt("长度不同");
            else
                Effects.prompt("打不过上家的牌");
            return false;
        }
        var action = cards.map(function (c) { return c.cardid; });
        infoProvider.notifyPlayerMove(action);
        // this.parseLog({ event: { player: infoProvider.getPlayerID(), action }});
        return true;
    };
    Game.prototype.prepareTL = function (delay, time) {
        var _this = this;
        if (delay === void 0) { delay = 0.8; }
        if (time === void 0) { time = 0.3; }
        this.pending = [];
        GameElement.tl = new TimelineMax();
        GameElement.tlHead = delay;
        GameElement.tlTime = time;
        GameElement.finalizeCallback = function (cb) { return _this.pending.push(cb); };
    };
    Game.prototype.tlCall = function (func) {
        GameElement.tl.call(func, null, null, GameElement.tlHead);
    };
    Game.prototype.addToTL = function (tween) {
        GameElement.tl.add(tween, GameElement.tlHead);
    };
    Game.prototype.finalizeTL = function () {
        var currTL = GameElement.tl;
        // 这个数组的长度甚至会变化……
        for (var _i = 0, _a = this.pending; _i < _a.length; _i++) {
            var cb = _a[_i];
            cb();
        }
        GameElement.finalizeCallback = requestAnimationFrame.bind(window);
        GameElement.tl = undefined;
        return currTL;
    };
    Game.prototype.visualInitialization = function () {
        for (var id in this.controls)
            this.controls[id] = $("#" + id);
        GameElement.initializeLayout();
        Effects.init();
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.update(true);
        }
    };
    return Game;
}());
var game;
$(function () {
    try {
        Util.logs = document.getElementById('logs');
        game = new Game();
    }
    catch (ex) {
        parent["Botzone"].alert(ex);
        console.error(ex);
        parent["$"]("#loading").fadeOut();
    }
});
var Logic;
(function (Logic) {
    Logic.CARD_ORDERS = {
        3: 0,
        4: 1,
        5: 2,
        6: 3,
        7: 4,
        8: 5,
        9: 6,
        10: 7,
        j: 8,
        q: 9,
        k: 10,
        a: 11,
        2: 12,
        o: 13
    };
    Logic.SUITS = ["h", "d", "s", "c"];
    Logic.POINTS = [
        "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k", "a", "2"
    ];
    var ORDER_MAX = 15;
    var ORDER_LJOKER = 13;
    var SEQ_MAX = 12; // 各种顺子最多到A，不能到2及以上
    function combinedCount(array, keySelector) {
        var counts = {};
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var obj = array_1[_i];
            var key = keySelector(obj);
            counts[key] = (counts[key] || 0) + 1;
        }
        return Object.keys(counts)
            .map(function (key) { return ({ key: parseInt(key), count: counts[key] }); })
            .sort(function (a, b) { return a.count === b.count ? a.key - b.key : b.count - a.count; });
    }
    function card2order(x) {
        if (x[1] === "o")
            return ((x[0] === "h" || x[0] === "d") ? 1 : 0) + Logic.CARD_ORDERS[x[1]];
        return Logic.CARD_ORDERS[x[1]];
    }
    var CardCombo = /** @class */ (function () {
        function CardCombo(cards) {
            this.cards = cards;
            this.orders = cards.map(card2order);
            this.bundles = combinedCount(this.orders, function (ord) { return ord; });
            this.comboInfo = this.getComboInfo();
        }
        CardCombo.prototype.findFirstValid = function (deck) {
            var _this = this;
            if (!this.comboInfo) {
                // 如果不需要大过谁，只需要随便出
                Effects.prompt("你无须跟牌");
                return null;
            }
            // 然后先看一下是不是火箭，是的话就过
            if (this.comboInfo.type === "火箭") {
                Effects.prompt("打不过……");
                return null;
            }
            // 现在打算从手牌中凑出同牌型的牌
            var deckCombo = new CardCombo(deck);
            var counts = new Array(ORDER_MAX);
            for (var i = 0; i < ORDER_MAX; i++)
                counts[i] = 0;
            for (var _i = 0, _a = deckCombo.bundles; _i < _a.length; _i++) {
                var b = _a[_i];
                counts[b.key] = b.count;
            }
            // 手牌如果不够用，直接不用凑了，看看能不能炸吧
            if (deck.length >= this.cards.length) {
                var result = (function () {
                    // 否则不断增大当前牌组的主牌，看看能不能找到匹配的牌组
                    // 开始增大主牌
                    var mainPackCount = 0;
                    for (mainPackCount = 1; mainPackCount < _this.bundles.length; mainPackCount++)
                        if (_this.bundles[mainPackCount].count !== _this.bundles[0].count ||
                            _this.bundles[mainPackCount].key - _this.bundles[mainPackCount - 1].key !== 1)
                            break;
                    var isSequential = _this.comboInfo.type.indexOf("顺") !== -1 ||
                        _this.comboInfo.type.indexOf("飞机") !== -1;
                    for (var i = 1;; i++) { // 增大多少
                        var j = void 0;
                        for (j = 0; j < mainPackCount; j++) {
                            var order = _this.bundles[j].key + i;
                            // 各种连续牌型的主牌不能到2，非连续牌型的主牌不能到小王，单张的主牌不能超过大王
                            if ((_this.comboInfo.type === "单张" && order >= ORDER_MAX) ||
                                (isSequential && order >= SEQ_MAX) ||
                                (_this.comboInfo.type !== "单张" && !isSequential && order >= ORDER_LJOKER))
                                return null;
                            // 如果手牌中这种牌不够，就不用继续增了
                            if (counts[order] < _this.bundles[j].count)
                                break;
                        }
                        if (j !== mainPackCount)
                            continue;
                        // 找到了合适的主牌，那么从牌呢？
                        // 如果手牌的种类数不够，那从牌的种类数就不够，也不行
                        if (deckCombo.bundles.length < _this.bundles.length)
                            continue;
                        // 好终于可以了
                        // 计算每种牌的要求数目吧
                        var requiredCounts = new Array(ORDER_MAX);
                        for (j = 0; j < mainPackCount; j++)
                            requiredCounts[_this.bundles[j].key + i] = _this.bundles[j].count;
                        for (j = mainPackCount; j < _this.bundles.length; j++)
                            for (var k = 0; k < ORDER_MAX; k++) {
                                if (requiredCounts[k] || counts[k] < _this.bundles[j].count)
                                    continue;
                                requiredCounts[k] = _this.bundles[j].count;
                                break;
                            }
                        // 开始产生解
                        var solve = [];
                        for (var _i = 0, deck_1 = deck; _i < deck_1.length; _i++) {
                            var c = deck_1[_i];
                            var order = card2order(c);
                            if (requiredCounts[order]) {
                                solve.push(c);
                                requiredCounts[order]--;
                            }
                        }
                        return new CardCombo(solve);
                    }
                })();
                if (result)
                    return result;
            }
            var _loop_2 = function (i) {
                if (counts[i] === 4)
                    return { value: new CardCombo(Logic.SUITS.map(function (s) { return [s, Logic.POINTS[i]]; })) };
            };
            // 实在找不到啊
            // 最后看一下能不能炸吧
            for (var i = 0; i < ORDER_LJOKER; i++) {
                var state_1 = _loop_2(i);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
            // 有没有火箭？
            if (counts[ORDER_LJOKER] + counts[ORDER_LJOKER + 1] === 2)
                return new CardCombo([["h", "o"], ["s", "o"]]);
            // ……
            return null;
        };
        CardCombo.prototype.canBeBeatenBy = function (cards) {
            var info = cards.comboInfo;
            if (!this.comboInfo || !info)
                return false;
            if (info.type === "火箭")
                return true;
            if (info.type === "炸弹")
                switch (this.comboInfo.type) {
                    case "火箭":
                        return false;
                    case "炸弹":
                        return info.order > this.comboInfo.order;
                    default:
                        return true;
                }
            return info.type === this.comboInfo.type && info.len === this.comboInfo.len && info.order > this.comboInfo.order;
        };
        CardCombo.prototype.getComboInfo = function () {
            var len = this.cards.length;
            if (len === 1)
                return { type: "单张", order: this.orders[0] };
            if (len === 2)
                if (this.orders[0] === this.orders[1])
                    return { type: "一对", order: this.orders[0] };
                else if (this.orders[0] >= Logic.CARD_ORDERS["o"] && this.orders[1] >= Logic.CARD_ORDERS["o"])
                    return { type: "火箭", order: 0 };
                else
                    return false;
            return this.check3Series() || this.check4Series() || this.checkSeries();
        };
        /**
         * 检查是不是顺子
         */
        CardCombo.prototype.checkSeries = function () {
            var len = this.cards.length;
            var i;
            if (len >= 5) {
                for (i = 1; i < len; i++)
                    if (this.orders[i] - this.orders[i - 1] !== 1 || this.orders[i] >= SEQ_MAX)
                        break;
                if (i === len)
                    return { type: "单顺", order: this.orders[0], len: len };
                if (len % 2 === 0) {
                    for (i = 1; i < len; i++)
                        if ((i % 2 === 1 ?
                            (this.orders[i] - this.orders[i - 1] !== 0) :
                            (this.orders[i] - this.orders[i - 1] !== 1)) ||
                            this.orders[i] >= SEQ_MAX)
                            break;
                    if (i === len)
                        return { type: "双顺", order: this.orders[0], len: len };
                }
            }
            return false;
        };
        /**
         * 检查是否满足一个或多个连续的“四带二”
         */
        CardCombo.prototype.check4Series = function () {
            var len = this.cards.length;
            var m = 0; // 0 - 四条*n，1 - 四带二单*n，2 - 四带二对*n
            for (m = 0; m < 3; m++)
                if (len % (4 + m * 2) === 0) {
                    var count = len / (4 + m * 2);
                    var i = void 0;
                    for (i = 0; i < count; i++)
                        if (this.bundles[i].count !== 4 || (count > 1 && this.bundles[i].key >= SEQ_MAX) ||
                            (i > 0 && this.bundles[i].key - this.bundles[i - 1].key !== 1))
                            break;
                    if (i !== count)
                        continue;
                    for (; i < this.bundles.length; i++)
                        if (this.bundles[i].count !== m)
                            break;
                    if (i !== this.bundles.length)
                        continue;
                    if (count === 1)
                        if (m === 0)
                            return { type: "炸弹", order: this.bundles[0].key };
                        else
                            return { type: m === 1 ? "四带二只" : "四带二对", order: this.bundles[0].key };
                    else if (m === 0)
                        return { type: "航天飞机", order: this.bundles[0].key, len: count };
                    else
                        return { type: m === 1 ? "航天飞机带小翼" : "航天飞机带大翼", order: this.bundles[0].key, len: count };
                }
            return false;
        };
        /**
         * 检查是否满足一个或多个连续的“三带m”
         */
        CardCombo.prototype.check3Series = function () {
            var len = this.cards.length;
            var m = 0;
            for (m = 0; m < 3; m++)
                if (len % (3 + m) === 0) {
                    var count = len / (3 + m);
                    var i = void 0;
                    for (i = 0; i < count; i++)
                        if (this.bundles[i].count !== 3 || (count > 1 && this.bundles[i].key >= SEQ_MAX) ||
                            (i > 0 && this.bundles[i].key - this.bundles[i - 1].key !== 1))
                            break;
                    if (i !== count)
                        continue;
                    for (; i < this.bundles.length; i++)
                        if (this.bundles[i].count !== m)
                            break;
                    if (i !== this.bundles.length)
                        continue;
                    if (count === 1)
                        if (m === 0)
                            return { type: "三条", order: this.bundles[0].key };
                        else
                            return { type: m === 1 ? "三带一" : "三带二", order: this.bundles[0].key };
                    else if (m === 0)
                        return { type: "飞机", order: this.bundles[0].key, len: count };
                    else
                        return { type: m === 1 ? "飞机带小翼" : "飞机带大翼", order: this.bundles[0].key, len: count };
                }
            return false;
        };
        return CardCombo;
    }());
    Logic.CardCombo = CardCombo;
})(Logic || (Logic = {}));
jQuery.fn.extend({
    shatter: function () {
        return this.each(function () {
            var text = this.textContent;
            var result = "";
            for (var _i = 0, _a = text.trim(); _i < _a.length; _i++) {
                var x = _a[_i];
                if (x === "" || x === " ")
                    result += "<div>&nbsp;</div>";
                else
                    result += "<div>" + x + "</div>";
            }
            this.innerHTML = result;
        });
    },
    expand: function () {
        var lastTween = this.data("lasttween");
        if (lastTween)
            lastTween.kill();
        this.data("lasttween", TweenMax.fromTo(this, 0.3, { scale: "+=0.3" }, { scale: 1 }));
        return this;
    },
    shrink: function () {
        var lastTween = this.data("lasttween");
        if (lastTween)
            lastTween.kill();
        this.data("lasttween", TweenMax.fromTo(this, 0.3, { scale: "-=0.3" }, { scale: 1 }));
        return this;
    },
    addNumberHandle: function () {
        var dom = this[0];
        dom._realNumber = parseInt(dom.innerHTML);
        Object.defineProperty(dom, "_contentAsNumber", {
            get: function () { return dom._realNumber; },
            set: function (v) { return dom.innerHTML = (dom._realNumber = Math.round(v)).toString(); }
        });
        return this;
    }
});
var Util;
(function (Util) {
    Util.translateError = {
        INVALID_PASS: "决策错误：在自己应该出牌时选择“过”",
        REPEATED_CARD: "决策错误：打出的牌不属于自己",
        MISSING_CARD: "决策错误：打出的牌不属于自己",
        OUT_OF_RANGE: "决策错误：非法的牌",
        LESS_COMPARE: "决策错误：指定的牌型打不过对方",
        INVALID_CARDTYPE: "决策错误：不是合法的牌型",
        MISMATCH_CARDTYPE: "决策错误：指定的牌型与对方不一致",
        MISMATCH_CARDLENGTH: "决策错误：指定的牌型与对方不一致",
        BAD_FORMAT: "决策格式错误",
        INVALID_BID: "叫分格式非法",
        INVALID_INPUT_VERDICT_RE: "程序崩溃",
        INVALID_INPUT_VERDICT_MLE: "程序内存爆炸",
        INVALID_INPUT_VERDICT_TLE: "决策超时",
        INVALID_INPUT_VERDICT_NJ: "程序输出不是JSON",
        INVALID_INPUT_VERDICT_OLE: "程序输出爆炸",
        INVALID_INPUT_VERDICT_OK: "决策格式错误"
    };
    var cnt = 0;
    /**
     * 对已经附加数字句柄的 JQuery 对象的内容作为数字进行动画补间
     * @param obj JQuery 对象
     * @param target 目标数字，或者是"+=xx"这样的变化量
     */
    function tweenContentAsNumber(obj, target) {
        var dom = obj[0];
        var first;
        var initial, last;
        return TweenMax.to(dom, 0.5, {
            _contentAsNumber: target,
            overwrite: "none",
            onStart: function () {
                if (!first)
                    return;
                first = true;
                initial = dom._contentAsNumber;
                last = initial;
            },
            onUpdate: function () {
                if ((first && dom._contentAsNumber - last > 0) || dom._contentAsNumber - last > 5) {
                    last = dom._contentAsNumber;
                    obj.expand();
                    first = false;
                }
                if ((first && last - dom._contentAsNumber > 0) || last - dom._contentAsNumber > 5) {
                    last = dom._contentAsNumber;
                    obj.shrink();
                    first = false;
                }
            }
        });
    }
    Util.tweenContentAsNumber = tweenContentAsNumber;
    var dummy = {};
    /**
     * 【抖】
     * @param amplitudeBase 抖动多大
     * @param target 抖动元素
     * @param durationBase 抖动多久
     */
    function shake(amplitudeBase, target, durationBase) {
        if (durationBase === void 0) { durationBase = 0.05; }
        var tl = new TimelineMax();
        var $body = $(target || "body");
        tl.call(function () { return $body.css("border", "none"); });
        for (var i = 0; i < 5; i++) {
            var amplitude = (11 - i * 2) * amplitudeBase;
            tl.to($body, durationBase, {
                x: Math.random() * amplitude * 2 - amplitude,
                y: Math.random() * amplitude * 2 - amplitude,
                yoyo: true
            });
        }
        tl.to($body, durationBase * 2, { x: 0, y: 0 });
        return tl;
    }
    Util.shake = shake;
    function biDirConstSet(obj, propName, to) {
        var _a;
        return TweenMax.set(obj, (_a = { immediateRender: false }, _a[propName] = to, _a));
    }
    Util.biDirConstSet = biDirConstSet;
    var constNode = document.createElement("p");
    /**
     * 将字符串中的危险字符进行转义
     * @param hostile 危险的字符串
     */
    function neutralize(hostile) {
        constNode.textContent = hostile.toString();
        return constNode.innerHTML;
    }
    Util.neutralize = neutralize;
    /**
     * 具象化某个模板
     * @param templateID 模板的ID
     */
    function insertTemplate(templateID) {
        var node = document.importNode(document.getElementById(templateID).content, true);
        var nodes = node.childNodes;
        for (var i = 0; i < nodes.length; i++)
            if (nodes[i].nodeType === Node.ELEMENT_NODE)
                return nodes[i];
    }
    Util.insertTemplate = insertTemplate;
    /**
     * 高效地将第二个数组连接到第一个
     * @param arr1 会被改变的数组
     * @param arr2 追加的新数组
     */
    function cat(arr1, arr2) {
        Array.prototype.push.apply(arr1, arr2);
    }
    Util.cat = cat;
    /**
     * 将两个元素为 number 的对象的元素取平均值输出
     * @param obj1
     * @param obj2
     */
    function mid(obj1, obj2) {
        var newObj = {};
        for (var key in obj1)
            newObj[key] = (obj1[key] + obj2[key]) / 2;
        return newObj;
    }
    Util.mid = mid;
    /**
     * 从数组中删除第一个指定元素并返回自身，失败不报错
     * @param arr 数组
     * @param obj 元素
     */
    function pull(arr, obj) {
        var idx = arr.indexOf(obj);
        if (idx >= 0)
            arr.splice(arr.indexOf(obj), 1);
        return arr;
    }
    Util.pull = pull;
    /**
     * 随机出范围内的一个整数
     * @param a 起始
     * @param b 终止（不含）
     */
    function randBetween(a, b) {
        return Math.floor(Math.random() * (b - a) + a);
    }
    Util.randBetween = randBetween;
    /**
     * 随机选择一个元素
     * @param arr 数组
     */
    function randomSelect(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    Util.randomSelect = randomSelect;
    /**
     * 翻转对象的Key和Value
     * @param obj 要翻转的对象
     */
    function invert(obj) {
        var newObj = {};
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            newObj[obj[k]] = k;
        }
        return newObj;
    }
    Util.invert = invert;
    function playerInfoToHTML(x) {
        return x.controls.title.text() + " <span>" + neutralize(x.controls.nick.text()) + "</span>";
    }
    function logComposeHTML(parts, args) {
        return parts.reduce(function (prev, curr, i) {
            var arg = args[i - 1];
            if (Array.isArray(arg)) {
                return "" + prev + arg.map(function (p) { return playerInfoToHTML(p); }).join("、") + curr;
            }
            if (typeof arg === "object") {
                return "" + prev + playerInfoToHTML(arg) + curr;
            }
            return prev + "<span>" + neutralize(arg) + "</span>" + curr;
        });
    }
    function Log(parts) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var newChild = document.createElement("div");
        newChild.innerHTML = logComposeHTML(parts, args);
        Util.logs.appendChild(newChild);
        var tl = new TimelineMax();
        tl.from(newChild, 0.1, { opacity: 0 });
        tl.to(newChild, 0.1, { height: 0, onComplete: function () { return Util.logs.removeChild(newChild); } }, 2);
    }
    Util.Log = Log;
    function CreatePrimaryLogger(channel) {
        return function (parts) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var newChild = document.createElement("div");
            newChild.className = "primary " + channel;
            newChild.innerHTML = logComposeHTML(parts, args);
            var oldLogs = Util.logs.querySelectorAll(".primary." + channel);
            var _loop_3 = function (i) {
                var c = oldLogs[i];
                TweenMax.to(c, 0.1, {
                    height: 0,
                    onComplete: function () {
                        try {
                            Util.logs.removeChild(c);
                        }
                        catch (_a) { }
                    },
                    delay: i === oldLogs.length - 1 ? 1 : 0
                });
            };
            for (var i = 0; i < oldLogs.length; i++) {
                _loop_3(i);
            }
            Util.logs.appendChild(newChild);
            TweenMax.from(newChild, 0.1, { opacity: 0 });
        };
    }
    Util.PlayerTurnLog = CreatePrimaryLogger("turn");
    Util.PlayerActionLog = CreatePrimaryLogger("action");
    Util.Bid = CreatePrimaryLogger("bid");
})(Util || (Util = {}));
