import { dedent, isSvelte5Plus, write_if_changed } from './utils.js';

/**
 * @param {import('types').ManifestData} manifest_data
 * @param {string} output
 */
export function write_root(manifest_data, output) {
	// TODO remove default layout altogether

	const max_depth = Math.max(
		...manifest_data.routes.map((route) =>
			route.page ? route.page.layouts.filter(Boolean).length + 1 : 0
		),
		1
	);

	const levels = [];
	for (let i = 0; i <= max_depth; i += 1) {
		levels.push(i);
	}

	let l = max_depth;

	let pyramid = dedent`
	${isSvelte5Plus() ? '<!-- svelte-ignore binding_property_non_reactive -->' : ''}
	<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}} {form} />
	`;

	while (l--) {
		pyramid = dedent`
			{#if constructors[${l + 1}]}
				${isSvelte5Plus() ? '<!-- svelte-ignore binding_property_non_reactive -->' : ''}
				<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}}>
					${pyramid}
				</svelte:component>
			{:else}
				${isSvelte5Plus() ? '<!-- svelte-ignore binding_property_non_reactive -->' : ''}
				<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}} {form} />
			{/if}
		`;
	}

	write_if_changed(
		`${output}/root.svelte`,
		dedent`
			<!-- This file is generated by @sveltejs/kit — do not edit it! -->
			${isSvelte5Plus() ? '<svelte:options runes={true} />' : ''}
			<script>
				import { setContext, ${isSvelte5Plus() ? '' : 'afterUpdate, '}onMount, tick } from 'svelte';
				import { browser } from '$app/environment';

				// stores
				${
					isSvelte5Plus()
						? dedent`
							let { stores, page, constructors, components = [], form, ${levels
								.map((l) => `data_${l} = null`)
								.join(', ')} } = $props();
						`
						: dedent`
							export let stores;
							export let page;

							export let constructors;
							export let components = [];
							export let form;
							${levels.map((l) => `export let data_${l} = null;`).join('\n')}
						`
				}

				if (!browser) {
					setContext('__svelte__', stores);
				}

				${
					isSvelte5Plus()
						? dedent`
							if (browser) {
								$effect.pre(() => stores.page.set(page));
							} else {
								stores.page.set(page);
							}
						`
						: '$: stores.page.set(page);'
				}
				${
					isSvelte5Plus()
						? dedent`
							$effect(() => {
								stores;page;constructors;components;form;${levels.map((l) => `data_${l}`).join(';')};
								stores.page.notify();
							});
						`
						: 'afterUpdate(stores.page.notify);'
				}

				let mounted = ${isSvelte5Plus() ? '$state(false)' : 'false'};
				let navigated = ${isSvelte5Plus() ? '$state(false)' : 'false'};
				let title = ${isSvelte5Plus() ? '$state(null)' : 'null'};

				onMount(() => {
					const unsubscribe = stores.page.subscribe(() => {
						if (mounted) {
							navigated = true;
							tick().then(() => {
								title = document.title || 'untitled page';
							});
						}
					});

					mounted = true;
					return unsubscribe;
				});
			</script>

			${pyramid}

			{#if mounted}
				<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px">
					{#if navigated}
						{title}
					{/if}
				</div>
			{/if}
		`
	);

	if (isSvelte5Plus()) {
		write_if_changed(
			`${output}/root.js`,
			dedent`
			import { asClassComponent } from 'svelte/legacy';
			import Root from './root.svelte';
			export default asClassComponent(Root);
		`
		);
	}
}
