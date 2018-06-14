namespace GameElement {
	export const playerTitles = [
		"地主", "农民甲", "农民乙"
	];
	export let fieldRadius: number;
	let cardHeight: number;
	let cardWidth: number;
	let cardGap: number;
	// 满手牌的弧度是多少
	let arcRad: number;
	// 19d（最多20张牌，19个间隔） = arcRad * r
	let virtualRadius: number;
	let gapRad: number;
	let mouseDownForBatchSelect: boolean | undefined;
	let zIndexMax = 1000;

	export let tl: TimelineMax;
	export let tlHead: number;
	export let tlTime: number;
	export let finalizeCallback: (cb: () => void) => void = requestAnimationFrame.bind(window);

	export function initializeLayout() {
		let realH: number;
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
		fieldRadius = (realH - cardHeight * 2) * 0.5;
	}

	export class Player {
		public deckCards: Card[] = [];
		public playedCards: Card[] = [];
		public disposedCards: Card[] = [];
		public $visual: JQuery;
		public controls = {
			info: null as JQuery,
			deckLeft: null as JQuery,
			submit: null as JQuery,
			pass: null as JQuery,
			title: null as JQuery,
			avatar: null as JQuery,
			nick: null as JQuery
		};
		private _enabled = false;
		private width: number;
		private left: number;
		private deckLastLength = 0;
		private nextTickUpdate = false;
		constructor(public readonly playerid: PlayerID) {
			this.$visual = $(Util.insertTemplate("player"));
			for (const id in this.controls) {
				const ctrl = this.controls[id] = this.$visual.find(`[data-id="${id}"]`);
				if (ctrl.hasClass("value"))
					ctrl.addNumberHandle();
			}
			this.controls.submit.click(() => {
				const selected = this.deckCards.filter(c => c.selected);
				if (selected.length === 0)
					game.trySubmit(null);
				else if (game.trySubmit(selected))
					this.enabled = false;
			});
			this.controls.pass.click(() => {
				if (game.trySubmit([]))
					this.enabled = false;
			});
			this.controls.title.text(playerTitles[playerid]);
			if (infoProvider.getPlayerNames())
				this.controls.nick.text(infoProvider.getPlayerNames()[playerid].name);
		}
		public clearBuffer() {
			// 清空上次自己出的牌
			Util.cat(this.disposedCards, this.playedCards);
			this.playedCards.length = 0;
			this.update();
		}
		public bringToTop() {
			if (tl)
				tl.add(Util.biDirConstSet(this.$visual[0].style, "zIndex", zIndexMax++), tlHead);
			else
				this.$visual.css("zIndex", zIndexMax++);
		}
		public playCard(cards: number[]) {
			for (const c of cards)
				for (let i = 0; i < this.deckCards.length; i++)
					if (this.deckCards[i].cardid === c) {
						const [ card ] = this.deckCards.splice(i, 1);
						card.revealed = true;
						this.playedCards.push(card);
					}
			this.bringToTop();
			this.update();
			return this.playedCards;
		}
		public get active() { return this.$visual.hasClass("active"); }
		public set active(to) {
			if (to)
				this.$visual.addClass("active");
			else
				this.$visual.removeClass("active");
		}
		public get visible() { return this.$visual.hasClass("visible"); }
		public set visible(to) {
			if (to)
				this.$visual.addClass("visible");
			else
				this.$visual.removeClass("visible");
		}
		public get enabled() { return this._enabled; }
		public set enabled(to) {
			if (this._enabled === to)
				return;
			this._enabled = to;
			if (to) {
				this.$visual.addClass("enabled");
				$(document).on("mousemove", e => {
					if (!this.enabled)
						return;
					const ratio = (e.pageX - this.left) / this.width;
					if (ratio < 0 || ratio > 1)
						return;
					for (let i = 0; i < this.deckCards.length; i++)
						this.deckCards[i].requestedScale = Math.cos(ratio - i / this.deckCards.length);
				}).on("mouseup", e => mouseDownForBatchSelect = undefined);
			} else {
				this.$visual.removeClass("enabled");
				$(document).off("mousemove mouseup");
			}
			mouseDownForBatchSelect = undefined;
			this.update();
		}
		public addCard(card: Card) {
			let i: number;
			if (!card.revealed) {
				for (i = 0; i < this.deckCards.length; i++)
					if (!this.deckCards[i].revealed &&
						this.deckCards[i].cardid > card.cardid) {
						this.deckCards.splice(i, 0, card);
						break;
					}
				if (i === this.deckCards.length)
					this.deckCards.push(card);
			} else
				this.deckCards.unshift(card);
			this.$visual.append(card.$visual);
			this.update();
		}
		public update(force = false) {
			if (!this.nextTickUpdate) {
				this.nextTickUpdate = true;
				finalizeCallback(() => {
					this.nextTickUpdate = false;
					for (let i = 0; i < this.deckCards.length; i++) {
						this.deckCards[i].nth = i;
						this.deckCards[i].total = this.deckCards.length;
						this.deckCards[i].enabled = this.enabled;
						this.deckCards[i].isInDeck = true;
						if (force)
							this.deckCards[i].updateTransform();
					}
					for (let i = 0; i < this.playedCards.length; i++) {
						this.playedCards[i].nth = i;
						this.playedCards[i].total = this.playedCards.length;
						this.playedCards[i].enabled = false;
						this.playedCards[i].isInDeck = false;
						if (force)
							this.playedCards[i].updateTransform();
					}
					for (const c of this.disposedCards) {
						c.visible = false;
						if (force)
							c.updateTransform();
					}
					if (this.deckLastLength !== this.deckCards.length) {
						if (tl)
							tl.add(Util.tweenContentAsNumber(this.controls.deckLeft, this.deckCards.length),
								tlHead);
						else
							Util.tweenContentAsNumber(this.controls.deckLeft, this.deckCards.length);
						this.deckLastLength = this.deckCards.length;
					}
					const halfFullRad = gapRad * (this.deckCards.length - 1) / 2;
					this.width = 2 * Math.sin(halfFullRad) * virtualRadius +
						cardWidth;
					const targetProps = {
						xPercent: "-50",
						yPercent: "-50",
						y: fieldRadius,
						width: this.width,
						height: cardHeight + (1 - Math.cos(halfFullRad)) * virtualRadius
					};
					targetProps.width = virtualRadius;
					TweenMax.set(this.controls.info, targetProps);
					this.left = this.$visual.offset().left - this.width / 2;
				});
			}
		}
	}

	export class Card {
		public static get(cardid: number) {
			return Card.allCards[cardid] = Card.allCards[cardid] || new Card(cardid);
		}
		private static readonly MAX_CARD_ID = 54;
		private static readonly allCards: Card[] = new Array(Card.MAX_CARD_ID);

		public $visual: JQuery;
		public readonly card: PokerCard;
		private _nth: number;
		private _total: number;
		private _isInDeck: boolean = true;
		private _requestedScale: number = 1;
		private _enabled = false;
		private _visible = true;
		private lastCardHeight: number;
		private isLeavingDeck = false;
		private nextTickUpdate = false;
		private constructor(public readonly cardid: number) {
			if (cardid < 52)
				this.card = [Logic.SUITS[cardid % 4], Logic.POINTS[Math.floor(cardid / 4)]];
			else
				this.card = [cardid === 53 ? "h" : "s", "o"];
			this.lastCardHeight = cardHeight;
			this.$visual = $('<figure class="card"></figure>');
			this.$visual.css("zIndex", cardid);
			this.resetVisual();
		}

		public updateTransform() {
			if (!this.nextTickUpdate) {
				this.nextTickUpdate = true;
				finalizeCallback(() => {
					this.nextTickUpdate = false;
					if (this.lastCardHeight !== cardHeight) {
						this.resetVisual();
						this.lastCardHeight = cardHeight;
					}

					if (tl)
						tl.add(Util.biDirConstSet(this.$visual[0].style, "zIndex", this.nth + 1), tlHead);
					else
						this.$visual.css("zIndex", this.nth + 1);

					let targetProps: any = {};
					if (this.visible) {
						if (!tl)
							TweenMax.set(this.$visual, { scale: this.enabled ? this.requestedScale : 1 });
						if (this.isLeavingDeck) {
							const param: any = {
								scale: 1.3,
								yoyo: true,
								repeat: 1,
								ease: parent["Expo"].easeOut
							};
							if (tl) {
								tl.set(this.$visual, { className: "+=played" }, tlHead);
								tl.fromTo(this.$visual, tlTime, { scale: 1 }, param, tlHead);
								tl.add(Util.shake(1, "#container", 0.02), tlHead + tlTime * 2);
							} else {
								this.$visual.addClass("played");
								param.onComplete = () => Util.shake(0.5, "#container", 0.02);
								TweenMax.fromTo(this.$visual, 0.2, { scale: 1 }, param);
							}
						}
						this.isLeavingDeck = false;

						const rad = gapRad * (this.nth - (this.total - 1) / 2);
						targetProps = {
							rotation: rad / Math.PI * 180,
							x: virtualRadius * Math.sin(rad),
							y: (this.isInDeck ? fieldRadius : 0) +
								virtualRadius * (1 - Math.cos(rad)),
							xPercent: "-50",
							yPercent: "-50",
							opacity: 1
						};
					} else
						targetProps = {
							opacity: 0
						};
					if (tl)
						tl.to(this.$visual, tlTime, targetProps, tlHead);
					else
						TweenMax.to(this.$visual, 0.2, targetProps);
				});
			}
		}

		private resetVisual() {
			this.$visual.html("");
			this.$visual.append(Poker.getCardImage(cardHeight, this.card[0], this.card[1]));
			this.$visual.append(Poker.getBackImage(cardHeight));
			this.$visual.css({
				borderRadius: cardHeight / 12.5,
				width: cardWidth,
				height: cardHeight
			});
			this.$visual.find("img").prop("draggable", false);
		}

		public get nth() { return this._nth; }
		public set nth(to) {
			if (this._nth === to)
				return;
			this._nth = to;
			this.updateTransform();
		}
		public get total() { return this._total; }
		public set total(to) {
			if (this._total === to)
				return;
			this._total = to;
			this.updateTransform();
		}
		public get publicCard() { return this.$visual.hasClass("public-card"); }
		public set publicCard(to) {
			if (to)
				this.$visual.addClass("public-card");
			else
				this.$visual.removeClass("public-card");
		}
		public get revealed() { return this.$visual.hasClass("revealed"); }
		public set revealed(to) {
			if (to)
				this.$visual.addClass("revealed");
			else
				this.$visual.removeClass("revealed");
		}
		public get enabled() { return this._enabled; }
		public set enabled(to) {
			if (this._enabled === to)
				return;
			this._enabled = to;
			if (!to) {
				this.$visual.removeClass("selected");
				this.$visual.off("mousemove mouseup mousedown");
			} else
				this.$visual.mousedown(e => {
					mouseDownForBatchSelect = !this.$visual.hasClass("selected");
					this.$visual.toggleClass("selected");
				}).mousemove(e => {
					if (mouseDownForBatchSelect === true)
						this.$visual.addClass("selected");
					else if (mouseDownForBatchSelect === false)
						this.$visual.removeClass("selected");
				}).mouseup(e => mouseDownForBatchSelect = undefined);
			this.updateTransform();
		}
		public get visible() { return this._visible; }
		public set visible(to) {
			if (this._visible === to)
				return;
			this._visible = to;
			if (!to)
				this.enabled = false;
			this.updateTransform();
		}
		public get requestedScale() { return this._requestedScale; }
		public set requestedScale(to) {
			if (this._requestedScale === to)
				return;
			this._requestedScale = to;
			this.updateTransform();
		}
		public get isInDeck() { return this._isInDeck; }
		public set isInDeck(to) {
			if (this._isInDeck === to)
				return;
			this._isInDeck = to;
			if (!to)
				this.isLeavingDeck = true;
			this.updateTransform();
		}
		public get selected() { return this.$visual.hasClass("selected"); }
		public set selected(to) {
			if (to)
				this.$visual.addClass("selected");
			else
				this.$visual.removeClass("selected");
		}
	}
}
