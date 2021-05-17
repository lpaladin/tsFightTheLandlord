namespace Effects {
	const controls = {
		common: null as JQuery,
		uncommon: null as JQuery,
		bomb: null as JQuery,
		fly: null as JQuery,
		prompt: null as JQuery,
		sbomb: null as JQuery,
		result: null as JQuery,
		call: null as JQuery
	};
	export function init() {
		for (const id in controls)
			controls[id] = $("#" + id);
		controls.bomb.find(".text").text("炸弹").shatter();
		controls.sbomb.find(".text").text("火箭").shatter();
	}
	export function fly(message: string) {
		const tl = new TimelineMax();
		tl.add(Util.biDirConstSet(controls.fly[0], "textContent", message));
		tl.fromTo(controls.fly, 0.7, { opacity: 0, xPercent: "-250" },
			{ opacity: 1, xPercent: "-50", ease: parent["Sine"].easeOut });
		tl.to(controls.fly, 0.7, { opacity: 0, xPercent: "150", ease: parent["Sine"].easeIn });
		return tl;
	}
	export function sbomb() {
		const tl = new TimelineMax();
		const characters = controls.sbomb.find("> div > div");
		const bkg = controls.sbomb.find(".bkg");
		tl.fromTo(controls.sbomb, 0.3, { opacity: 0 }, { opacity: 1 });
		tl.fromTo(bkg, 0.3, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, immediateRender: false }, 0.5);
		tl.staggerFromTo(characters, 1, { opacity: 0, scale: 3, y: 0 },
			{ opacity: 1, scale: 1, ease: parent["Expo"].easeIn }, 0.15, 0);
		tl.to(characters, 1, { y: "-100", opacity: 0 });
		tl.to(controls.sbomb, 0.5, { opacity: 0 });
		return tl;
	}
	export function bomb() {
		const tl = new TimelineMax();
		const characters = controls.bomb.find("> div > div");
		const bkg = controls.bomb.find(".bkg");
		tl.fromTo(controls.bomb, 0.3, { opacity: 0 }, { opacity: 1 });
		tl.fromTo(bkg, 0.3, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, immediateRender: false }, 0.5);
		tl.staggerFromTo(characters, 1, { opacity: 0, scale: 3 },
			{ opacity: 1, scale: 1, ease: parent["Expo"].easeIn }, 0.15, 0);
		tl.to(controls.bomb, 0.5, { opacity: 0 }, "+=1");
		return tl;
	}
	export function uncommon(message: string) {
		const tl = new TimelineMax();
		tl.add(Util.biDirConstSet(controls.uncommon[0], "textContent", message));
		tl.fromTo(controls.uncommon, 0.3, { scale: 0, opacity: 1 },
			{ scale: 1, ease: parent["Back"].easeOut, immediateRender: false });
		tl.to(controls.uncommon, 0.5, { opacity: 0 }, "+=1");
		return tl;
	}
	export function result(resultStr: string, message: string) {
		// 仅可调用一次
		const tl = new TimelineMax();
		const r = controls.result.find(".result").text(resultStr).shatter().find("> *");
		const m = controls.result.find(".reason").text(message).shatter().find("> *");
		tl.fromTo(controls.result, 0.3, { opacity: 0, scale: 0 },
			{ opacity: 1, scale: 1, ease: parent["Back"].easeOut });
		tl.staggerFrom(r, 0.3, { scale: 1.3, opacity: 0 }, 0.1);
		tl.staggerFrom(m, 0.2, { opacity: 0 }, 0.05);
		return tl;
	}
	export function prompt(message: string) {
		const tl = new TimelineMax();
		tl.add(Util.biDirConstSet(controls.prompt[0], "textContent", message));
		tl.fromTo(controls.prompt, 0.3, { opacity: 0, yPercent: "100" },
			{ opacity: 1, yPercent: "0", ease: parent["Back"].easeOut });
		tl.to(controls.prompt, 0.5, { opacity: 0 }, "+=2");
		return tl;
	}
	function commonlyEffect(control: JQuery, playerid: number, message: string) {
		const tl = new TimelineMax();
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
	export function common(playerid: number, message: string) {
		return commonlyEffect(controls.common, playerid, message);
	}

	export function call(playerid: number, message: string) {
		return commonlyEffect(controls.call, playerid, message);
	}
}
