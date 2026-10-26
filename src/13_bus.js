// ================= BUS D'ÉVÉNEMENTS (contrat partagé entre modules) =================
// Les modules 14+ écoutent ces événements au lieu de modifier les fonctions existantes.
const GAME = {
  _h: {},
  on(ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
  emit(ev, data) { (this._h[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error('GAME', ev, e); } }); },
  // « Sert à… » : chaque module enregistre une fonction (item) => [{ txt, kind }] ; kind : 'reve' | 'batiment' | 'recette' | 'collection'
  _uses: [],
  addUses(fn) { this._uses.push(fn); },
  usesOf(it) { const out = []; for (const f of this._uses) { try { out.push(...(f(it) || [])); } catch (e) {} } return out; },
};
// --- émissions branchées sur les fonctions existantes ---
{
  const _start = startTrip;
  startTrip = function () { const k = S.sel, dest = plan.dest; _start.apply(this, arguments); if (S.trips[k]) GAME.emit('trip:start', { who: k, dest, trip: S.trips[k] }); };
  const _collect = collect;
  collect = function () { const k = S.sel, t = S.trips[k]; const before = S.inv.length; _collect.apply(this, arguments); if (t && !S.trips[k]) GAME.emit('trip:return', { who: k, trip: t, dest: t.dest, items: S.inv.slice(before) }); };
  const _craft = craft;
  craft = function (id) { const n0 = S.stats.crafted; _craft.apply(this, arguments); if (S.stats.crafted > n0) GAME.emit('craft', { id, item: S.inv[S.inv.length - 1], who: S.sel }); };
}
