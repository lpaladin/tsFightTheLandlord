namespace Logic {
	export const CARD_ORDERS = {
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
	export const SUITS: PokerSuit[] = ["h", "d", "s", "c"];
	export const POINTS: PokerPoint[] = [
		"3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k", "a", "2"
	];
	const ORDER_MAX = 15;
	const ORDER_LJOKER = 13;
	const SEQ_MAX = 12; // 各种顺子最多到A，不能到2及以上

	interface ICounter {
		key: number;
		count: number;
	}

	function combinedCount<T>(array: T[], keySelector: (obj: T) => number): ICounter[] {
		const counts: { [key: number]: number } = {};
		for (const obj of array) {
			const key = keySelector(obj);
			counts[key] = (counts[key] || 0) + 1;
		}

		return Object.keys(counts)
			.map(key => ({ key: parseInt(key), count: counts[key] as number }))
			.sort((a, b) => a.count === b.count ? a.key - b.key : b.count - a.count);
	}

	function card2order(x: PokerCard) {
		if (x[1] === "o")
			return ((x[0] === "h" || x[0] === "d") ? 1 : 0) + CARD_ORDERS[x[1]];
		return CARD_ORDERS[x[1]];
	}

	interface IComboInfo {
		type: string;
		order: number; // 牌组的大小序，通常包含所有起比较作用的牌的序
		len?: number; // 顺子 / 飞机 / 航天飞机的长度
	}

	export class CardCombo {
		public readonly orders: number[];
		public readonly bundles: ICounter[]; // 按order排序
		public readonly comboInfo: IComboInfo | false;

		constructor(public readonly cards: PokerCard[]) {
			this.orders = cards.map(card2order);
			this.bundles = combinedCount(this.orders, ord => ord);
			this.comboInfo = this.getComboInfo();
		}

		public findFirstValid(deck: PokerCard[]): CardCombo {
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
			const deckCombo = new CardCombo(deck);
			const counts: number[] = new Array(ORDER_MAX);
			for (let i = 0; i < ORDER_MAX; i++)
				counts[i] = 0;
			for (const b of deckCombo.bundles)
				counts[b.key] = b.count;

			// 手牌如果不够用，直接不用凑了，看看能不能炸吧
			if (deck.length >= this.cards.length) {
				const result = (() => {
					// 否则不断增大当前牌组的主牌，看看能不能找到匹配的牌组
					// 开始增大主牌
					let mainPackCount = 0;
					for (mainPackCount = 1; mainPackCount < this.bundles.length; mainPackCount++)
						if (this.bundles[mainPackCount].count !== this.bundles[0].count ||
							this.bundles[mainPackCount].key - this.bundles[mainPackCount - 1].key !== 1)
							break;
					const isSequential = this.comboInfo.type.indexOf("顺") !== -1 ||
						this.comboInfo.type.indexOf("飞机") !== -1;
					for (let i = 1; ; i++) { // 增大多少
						let j: number;
						for (j = 0; j < mainPackCount; j++) {
							const order = this.bundles[j].key + i;

							// 各种连续牌型的主牌不能到2，非连续牌型的主牌不能到小王，单张的主牌不能超过大王
							if ((this.comboInfo.type === "单张" && order >= ORDER_MAX) ||
								(isSequential && order >= SEQ_MAX) ||
								(this.comboInfo.type !== "单张" && !isSequential && order >= ORDER_LJOKER))
								return null;

							// 如果手牌中这种牌不够，就不用继续增了
							if (counts[order] < this.bundles[j].count)
								break;
						}
						if (j !== mainPackCount)
							continue;

						// 找到了合适的主牌，那么从牌呢？
						// 如果手牌的种类数不够，那从牌的种类数就不够，也不行
						if (deckCombo.bundles.length < this.bundles.length)
							continue;

						// 好终于可以了
						// 计算每种牌的要求数目吧
						const requiredCounts = new Array(ORDER_MAX);
						for (j = 0; j < mainPackCount; j++)
							requiredCounts[this.bundles[j].key + i] = this.bundles[j].count;
						for (j = mainPackCount; j < this.bundles.length; j++)
							for (let k = 0; k < ORDER_MAX; k++) {
								if (requiredCounts[k] || counts[k] < this.bundles[j].count)
									continue;
								requiredCounts[k] = this.bundles[j].count;
								break;
							}

						// 开始产生解
						const solve: PokerCard[] = [];
						for (const c of deck)
						{
							const order = card2order(c);
							if (requiredCounts[order]) {
								solve.push(c);
								requiredCounts[order]--;
							}
						}
						return new CardCombo(solve);
					}
				}) ();
				if (result)
					return result;
			}

			// 实在找不到啊
			// 最后看一下能不能炸吧

			for (let i = 0; i < ORDER_LJOKER; i++)
				if (counts[i] === 4)
					// 还真可以啊……
					return new CardCombo(SUITS.map(s => [s, POINTS[i]] as PokerCard));

			// 有没有火箭？
			if (counts[ORDER_LJOKER] + counts[ORDER_LJOKER + 1] === 2)
				return new CardCombo([["h", "o"], ["s", "o"]]);

			// ……
			return null;
		}

		public canBeBeatenBy(cards: CardCombo) {
			const info = cards.comboInfo;
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
		}

		private getComboInfo(): IComboInfo | false {
			const len = this.cards.length;
			if (len === 1)
				return { type: "单张", order: this.orders[0] };
			if (len === 2)
				if (this.orders[0] === this.orders[1])
					return { type: "一对", order: this.orders[0] };
				else if (this.orders[0] >= CARD_ORDERS["o"] && this.orders[1] >= CARD_ORDERS["o"])
					return { type: "火箭", order: 0 };
				else
					return false;
			return this.check3Series() || this.check4Series() || this.checkSeries();
		}
		/**
		 * 检查是不是顺子
		 */
		private checkSeries(): IComboInfo | false {
			const len = this.cards.length;
			let i: number;
			if (len >= 5) {
				for (i = 1; i < len; i++)
					if (this.orders[i] - this.orders[i - 1] !== 1 || this.orders[i] >= SEQ_MAX)
						break;
				if (i === len)
					return { type: "单顺", order: this.orders[0], len };

				if (len % 2 === 0) {
					for (i = 1; i < len; i++)
						if ((i % 2 === 1 ?
							(this.orders[i] - this.orders[i - 1] !== 0) :
							(this.orders[i] - this.orders[i - 1] !== 1)) ||
							this.orders[i] >= SEQ_MAX)
							break;
					if (i === len)
						return { type: "双顺", order: this.orders[0], len };
				}
			}
			return false;
		}

		/**
		 * 检查是否满足一个或多个连续的“四带二”
		 */
		private check4Series(): IComboInfo | false {
			const len = this.cards.length;
			let m = 0; // 0 - 四条*n，1 - 四带二单*n，2 - 四带二对*n
			for (m = 0; m < 3; m++)
				if (len % (4 + m * 2) === 0) {
					const count = len / (4 + m * 2);
					let i: number;
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
					else
						if (m === 0)
							return { type: "航天飞机", order: this.bundles[0].key, len: count };
						else
							return { type: m === 1 ? "航天飞机带小翼" : "航天飞机带大翼", order: this.bundles[0].key, len: count };
				}
			return false;
		}

		/**
		 * 检查是否满足一个或多个连续的“三带m”
		 */
		private check3Series(): IComboInfo | false {
			const len = this.cards.length;
			let m = 0;
			for (m = 0; m < 3; m++)
				if (len % (3 + m) === 0) {
					const count = len / (3 + m);
					let i: number;
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
					else
						if (m === 0)
							return { type: "飞机", order: this.bundles[0].key, len: count };
						else
							return { type: m === 1 ? "飞机带小翼" : "飞机带大翼", order: this.bundles[0].key, len: count };
				}
			return false;
		}
	}
}
