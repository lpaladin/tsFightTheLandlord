interface JQuery {
	/**
	 * 打碎文本并将每一个字用figure包裹
	 */
	shatter(): JQuery;
	/**
	 * 变大一下
	 */
	expand(): JQuery;
	/**
	 * 变小一下
	 */
	shrink(): JQuery;
	/**
	 * 给内容是整数的DOM增加一个属性用于greensocks设置
	 */
	addNumberHandle(): JQuery;
}

interface HTMLElement {
	/**
	 * 使用$(...).addNumberHandle增加的内部属性
	 */
	_realNumber?: number;
	/**
	 * 使用$(...).addNumberHandle增加的对外属性
	 */
	_contentAsNumber?: number;
}

jQuery.fn.extend({
	shatter(): JQuery {
		return this.each(function () {
			const text: string = this.textContent;
			let result = "";
			for (const x of text.trim())
				if (x === "" || x === " ")
					result += `<div>&nbsp;</div>`;
				else
					result += `<div>${x}</div>`;
			this.innerHTML = result;
		});
	},
	expand(): JQuery {
		const lastTween: TweenMax = this.data("lasttween");
		if (lastTween)
			lastTween.kill();
		this.data("lasttween", TweenMax.fromTo(this, 0.3, { scale: "+=0.3" }, { scale: 1 }));
		return this;
	},
	shrink(): JQuery {
		const lastTween: TweenMax = this.data("lasttween");
		if (lastTween)
			lastTween.kill();
		this.data("lasttween", TweenMax.fromTo(this, 0.3, { scale: "-=0.3" }, { scale: 1 }));
		return this;
	},
	addNumberHandle(): JQuery {
		const dom: HTMLElement = this[0];
		dom._realNumber = parseInt(dom.innerHTML);
		Object.defineProperty(dom, "_contentAsNumber", {
			get: () => dom._realNumber,
			set: v => dom.innerHTML = (dom._realNumber = Math.round(v)).toString()
		});
		return this;
	}
});

namespace Util {

	export let translateError = {
		INVALID_PASS: "决策错误：在自己应该出牌时选择“过”",
		REPEATED_CARD: "决策错误：打出的牌不属于自己",
		MISSING_CARD: "决策错误：打出的牌不属于自己",
		OUT_OF_RANGE: "决策错误：非法的牌",
		LESS_COMPARE: "决策错误：指定的牌型打不过对方",
		MISMATCH_CARDTYPE: "决策错误：指定的牌型与对方不一致",
		MISMATCH_CARDLENGTH: "决策错误：指定的牌型与对方不一致",
		BAD_FORMAT: "决策格式错误",
		INVALID_INPUT_VERDICT_RE: "程序崩溃",
		INVALID_INPUT_VERDICT_MLE: "程序内存爆炸",
		INVALID_INPUT_VERDICT_TLE: "决策超时",
		INVALID_INPUT_VERDICT_NJ: "程序输出不是JSON",
		INVALID_INPUT_VERDICT_OLE: "程序输出爆炸",
		INVALID_INPUT_VERDICT_OK: "决策格式错误"
	};
	let cnt = 0;
	/**
	 * 对已经附加数字句柄的 JQuery 对象的内容作为数字进行动画补间
	 * @param obj JQuery 对象
	 * @param target 目标数字，或者是"+=xx"这样的变化量
	 */
	export function tweenContentAsNumber(obj: JQuery, target: number | string) {
		const dom: HTMLElement = obj[0];
		let first: boolean;
		let initial: number, last: number;
		return TweenMax.to(dom, 0.5, {
			_contentAsNumber: target,
			overwrite: "none",
			onStart: () => {
				if (!first)
					return;
				first = true;
				initial = dom._contentAsNumber;
				last = initial;
			},
			onUpdate: () => {
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

	const dummy = {};

	/**
	 * 【抖】
	 * @param amplitudeBase 抖动多大
	 * @param target 抖动元素
	 * @param durationBase 抖动多久
	 */
	export function shake(amplitudeBase: number, target?, durationBase: number = 0.05) {
		const tl = new TimelineMax();
		const $body = $(target || "body");
		tl.call(() => $body.css("border", "none"));
		for (let i = 0; i < 5; i++) {
			const amplitude = (11 - i * 2) * amplitudeBase;
			tl.to($body, durationBase, {
				x: Math.random() * amplitude * 2 - amplitude,
				y: Math.random() * amplitude * 2 - amplitude,
				yoyo: true
			});
		}
		tl.to($body, durationBase * 2, { x: 0, y: 0 });
		return tl;
	}

	export function biDirConstSet(obj: object, propName: string, to: (() => void) | any) {
		return TweenMax.set(obj, { immediateRender: false, [propName]: to });
	}

	const constNode = document.createElement("p");

	/**
	 * 将字符串中的危险字符进行转义
	 * @param hostile 危险的字符串
	 */
	export function neutralize(hostile: string) {
		constNode.textContent = hostile;
		return constNode.innerHTML;
	}

	/**
	 * 具象化某个模板
	 * @param templateID 模板的ID
	 */
	export function insertTemplate(templateID: string) {
		const node = document.importNode(
			(document.getElementById(templateID) as HTMLTemplateElement).content, true);
		const nodes = node.childNodes;
		for (let i = 0; i < nodes.length; i++)
			if (nodes[i].nodeType === Node.ELEMENT_NODE)
				return nodes[i];
	}

	/**
	 * 高效地将第二个数组连接到第一个
	 * @param arr1 会被改变的数组
	 * @param arr2 追加的新数组
	 */
	export function cat<T>(arr1: T[], arr2: T[]): void {
		Array.prototype.push.apply(arr1, arr2);
	}

	/**
	 * 将两个元素为 number 的对象的元素取平均值输出
	 * @param obj1
	 * @param obj2
	 */
	export function mid<T extends { [key: string]: number }>(obj1: T, obj2: T): T {
		const newObj: any = {};
		for (const key in obj1)
			newObj[key] = (obj1[key] + obj2[key]) / 2;
		return newObj;
	}

	/**
	 * 从数组中删除第一个指定元素并返回自身，失败不报错
	 * @param arr 数组
	 * @param obj 元素
	 */
	export function pull<T>(arr: T[], obj: T): T[] {
		const idx = arr.indexOf(obj);
		if (idx >= 0)
			arr.splice(arr.indexOf(obj), 1);
		return arr;
	}

	/**
	 * 随机出范围内的一个整数
	 * @param a 起始
	 * @param b 终止（不含）
	 */
	export function randBetween(a: number, b: number): number {
		return Math.floor(Math.random() * (b - a) + a);
	}

	/**
	 * 随机选择一个元素
	 * @param arr 数组
	 */
	export function randomSelect<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	/**
	 * 翻转对象的Key和Value
	 * @param obj 要翻转的对象
	 */
	export function invert(obj) {
		const newObj = {};
		for (const k of Object.keys(obj)) {
			newObj[obj[k]] = k;
		}
		return newObj;
	}
}
