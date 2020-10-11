interface FirstTurnsDisplayLog {
	allocation: number[][];
	publiccard: number[];
	landlord?: number;
	bid: number[];
}
interface DisplayLog {
	event: {
		player: number;
		action: number[];
	};
	errorInfo?: string;
	0?: number;
	1?: number;
	2?: number;
}

// TODO：tweencontentasnumber在页面ajaxload回来后会出现鬼畜的效果……
class Game {
	public players: GameElement.Player[];
	private landlord: number | undefined = undefined;
	private publiccards: number[] | undefined = undefined;
	private allocationReceived = false;
	public controls = {
		container: null as JQuery
	};
	private pending: Array<() => void> = [];
	private passStreak = 0;
	private lastValidCombo: Logic.CardCombo;
	constructor() {
		// $(window).resize(this.visualInitialization.bind(this));
		if (parent !== window) {
			window["TweenMax"] = infoProvider.v2.TweenMax;
			window["TimelineMax"] = infoProvider.v2.TimelineMax;
			this.prepareTL(0, 0.2);
			infoProvider.v2.setMinSize(0, 500);
		}
		this.players = [0, 1, 2].map(id => new GameElement.Player(id as PlayerID));
		for (const p of this.players)
			$("#container").append(p.$visual);
		this.visualInitialization();

		if (parent !== window) {
			if (infoProvider.isLive() && infoProvider.getPlayerID() >= 0) {
				this.players[infoProvider.getPlayerID()].visible = true;
				this.controls.container.addClass("curr-" + infoProvider.getPlayerID());
				if (infoProvider.getPlayerID() === 1)
					TweenMax.set(this.controls.container, { rotation: 120 });
				else if (infoProvider.getPlayerID() === 2)
					TweenMax.set(this.controls.container, { rotation: -120 });
			} else {
				this.controls.container.addClass("curr-0");
				for (const p of this.players)
					p.visible = true;
			}

			const tl = this.finalizeTL();

			infoProvider.v2.setRequestCallback(req => {
				console.log(req);
				if ("bid" in req) {
					this.players[infoProvider.getPlayerID()].callEnabled = true;
				} else {
					this.players[infoProvider.getPlayerID()].enabled = true;
				}
				return null;
			});
			infoProvider.v2.setDisplayCallback(this.parseLog.bind(this));
			infoProvider.v2.setGameOverCallback(scores => {
				for (const p of this.players) {
					p.visible = true;
					p.enabled = false;
				}
				return null;
			});

			infoProvider.v2.notifyInitComplete(tl);
		} else {
			for (const p of this.players)
				TweenMax.fromTo(p.controls.info, 0.4, { opacity: 0 }, { opacity: 1 });
			infoProvider.notifyPlayerMove = (cards: number[]) => {
				this.lastValidCombo = new Logic.CardCombo(this.players[0].playCard(cards).map(c => c.card));
				Util.randomSelect([
					() => Effects.fly("飞机带XX"),
					() => Effects.bomb(),
					() => Effects.sbomb(),
					() => Effects.uncommon("顺子"),
					() => Effects.common(0, "常见")
				])();
				setTimeout(() => this.players[0].enabled = this.players[0].visible = true, 1000);
			};
			let j = 0;
			for (const p of this.players)
				for (let i = 0; i < 17; i++) {
					const card = GameElement.Card.get(j++);
					if (j > 48)
						card.revealed = true;
					p.addCard(card);
				}
			this.players[0].enabled = this.players[0].visible = true;
		}
	}
	public parseLog(display: FirstTurnsDisplayLog | DisplayLog) {
		if ("event" in display) {
			this.prepareTL();
			if (display.event.player === -1)
				display.event.player = 0;
			for (const p of this.players)
				GameElement.tl.add(
					Util.biDirConstSet(p, "active", p.playerid === display.event.player));
			if (display.event.action.length > 0) {
				const cards = this.players[display.event.player].playCard(display.event.action)
					.map(c => c.card);
				if (cards.length > 0) {
					const combo = new Logic.CardCombo(cards);
					if (combo.comboInfo) {
						this.passStreak = 0;
						this.lastValidCombo = combo;
						switch (combo.comboInfo.type) {
							case "炸弹":
								this.addToTL(Effects.bomb());
								break;
							case "火箭":
								this.addToTL(Effects.sbomb());
								break;
							case "单顺":
							case "双顺":
								this.addToTL(Effects.uncommon(combo.comboInfo.type));
								break;
							case "航天飞机":
							case "航天飞机带小翼":
							case "航天飞机带大翼":
							case "飞机":
							case "飞机带小翼":
							case "飞机带大翼":
								this.addToTL(Effects.fly(combo.comboInfo.type));
								break;
							default:
								this.addToTL(Effects.common(display.event.player, combo.comboInfo.type));
						}
					}
				}
			} else {
				this.addToTL(Effects.common(display.event.player, "过"));
				this.passStreak++;
				if (this.passStreak === 2)
					this.lastValidCombo = undefined;
			}
			this.players[(display.event.player + 1) % 3].clearBuffer();
			if ("0" in display) {
				const landlordScore = display[this.landlord];
				const farmerScore = display[(this.landlord + 1) % 3];
				let err = Util.translateError[display.errorInfo];
				if (err)
					err = this.players[display.event.player].controls.title.text() + err;
				else
					err = "游戏结束，" + (landlordScore > farmerScore ? `地主从农民处赢得 ${landlordScore} 分` : `每个农民从地主处赢得 ${farmerScore} 分`);
				GameElement.tl.add(Effects.result(landlordScore > farmerScore ? "地主胜利" : "农民胜利", err));
			}
			return this.finalizeTL();
		} else if ("allocation" in display && !this.allocationReceived) {
			this.allocationReceived = true;
			this.prepareTL(0);
			for (let i = 0; i < this.players.length; i++)
				for (const card of display.allocation[i])
					this.players[i].addCard(GameElement.Card.get(card));
			this.publiccards = display.publiccard;
			const currTL = this.finalizeTL();
			for (const p of this.players)
				currTL.fromTo(p.controls.info, 0.4, { opacity: 0 }, { opacity: 1 });
			return currTL;
		} else if ("landlord" in display && this.landlord === undefined) {
			this.prepareTL();
			this.landlord = display.landlord;
			for (let i = 0; i < this.players.length; i++)
				this.players[i].updateTitle(display.landlord);
			
			for (const publiccard of this.publiccards) {
				const c = GameElement.Card.get(publiccard);
				c.publicCard = true;
				this.players[this.landlord].addCard(c);
				if (infoProvider.getPlayerID() !== this.landlord)
					c.revealed = true;
			}
			const currTL = this.finalizeTL();
			for (const p of this.players)
				currTL.fromTo(p.controls.info, 0.4, { opacity: 0 }, { opacity: 1 });
			return currTL;
		} else if ("bid" in display) {
			this.prepareTL();
			const idx = display.bid.length - 1;
			this.addToTL(Effects.call(idx, GameElement.calls[display.bid[idx]]));
			return this.finalizeTL();
		}
	}
	public callBid(bid: number) {
		infoProvider.notifyPlayerMove(bid);
	}
	public trySubmit(cards: GameElement.Card[]) {
		if (!cards) {
			// 试图自动匹配
			if (!this.lastValidCombo) {
				Effects.prompt("无须跟牌");
				return false;
			}
			const deckCards = this.players[infoProvider.getPlayerID() || 0].deckCards;
			const cmb = this.lastValidCombo.findFirstValid(deckCards.map(c => c.card));
			if (!cmb) {
				Effects.prompt("无法跟牌");
				return false;
			}
			for (const c of deckCards) {
				c.selected = false;
				for (const dc of cmb.cards)
					if (c.card[0] === dc[0] && c.card[1] === dc[1]) {
						c.selected = true;
						break;
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
			this.parseLog({ event: { player: infoProvider.getPlayerID(), action: [] }});
			return true;
		}

		const newCombo = new Logic.CardCombo(cards.map(c => c.card));
		if (!newCombo.comboInfo) {
			Effects.prompt("不存在该牌型");
			return false;
		}
		if (this.lastValidCombo && !this.lastValidCombo.canBeBeatenBy(newCombo)) {
			if (this.lastValidCombo.comboInfo &&
				this.lastValidCombo.comboInfo.type !== newCombo.comboInfo.type)
				Effects.prompt(`牌型${newCombo.comboInfo.type}不能打${this.lastValidCombo.comboInfo.type}`);
			else if (this.lastValidCombo.comboInfo &&
				this.lastValidCombo.comboInfo.len !== newCombo.comboInfo.len)
				Effects.prompt("长度不同");
			else
				Effects.prompt("打不过上家的牌");
			return false;
		}
		const action = cards.map(c => c.cardid);
		infoProvider.notifyPlayerMove(action);
		this.parseLog({ event: { player: infoProvider.getPlayerID(), action }});
		return true;
	}
	public prepareTL(delay = 0.8, time = 0.3) {
		this.pending = [];
		GameElement.tl = new TimelineMax();
		GameElement.tlHead = delay;
		GameElement.tlTime = time;
		GameElement.finalizeCallback = cb => this.pending.push(cb);
	}
	public addToTL(tween: TweenMax | TimelineMax) {
		GameElement.tl.add(tween, GameElement.tlHead);
	}
	public finalizeTL() {
		const currTL = GameElement.tl;

		// 这个数组的长度甚至会变化……
		for (const cb of this.pending)
			cb();
		GameElement.finalizeCallback = requestAnimationFrame.bind(window);
		GameElement.tl = undefined;

		return currTL;
	}
	private visualInitialization() {
		for (const id in this.controls)
			this.controls[id] = $("#" + id);
		GameElement.initializeLayout();
		Effects.init();
		for (const p of this.players)
			p.update(true);
	}
}

let game: Game;
$(() => {
	try {
		game = new Game();
	} catch (ex) {
		parent["Botzone"].alert(ex);
		console.error(ex);
		parent["$"]("#loading").fadeOut();
	}
});
