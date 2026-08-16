var ReadingQueueNumbers = {
  notifierID: null, menuID: null, columnID: null, toolsPopup: null, toolsPopupListener: null, chain: Promise.resolve(), rootURI: null,
  async startup({ id, rootURI }) {
    this.rootURI = rootURI;
    await this.addToWindow(Zotero.getMainWindow());
    this.bindMenuLabelFallback(Zotero.getMainWindow());
    this.notifierID = Zotero.Notifier.registerObserver(this, ["item"], "reading-queue-numbers");
    try {
      this.menuID = Zotero.MenuManager.registerMenu({menuID:"global-number-tools",pluginID:id,target:"main/menubar/tools",menus:[{menuType:"submenu",l10nID:"global-number-menu",menus:[
        {menuType:"menuitem",l10nID:"global-number-menu-status",onCommand:()=>this.showStatus()},
        {menuType:"menuitem",l10nID:"global-number-menu-assign",onCommand:(_e,c)=>this.assignSelected(c.items||[])},
        {menuType:"menuitem",l10nID:"global-number-menu-backfill",onCommand:()=>this.backfillExisting()}]}]});
    } catch (error) { Zotero.logError(error); }
    try {
      this.columnID = await Zotero.ItemTreeManager.registerColumn({dataKey:"globalNumber",label:"全局编号",pluginID:id,width:"92px",minWidth:65,staticWidth:true,zoteroPersist:["width","hidden","sortDirection"],dataProvider:item=>this.getNumber(item)||""});
    } catch (error) { Zotero.logError(error); }
  },
  async addToWindow(window) {
    if (!window || !this.rootURI || !window.MozXULElement) return;
    const locale = Services.locale.appLocaleAsBCP47?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
    await window.MozXULElement.insertFTLIfNeeded(this.rootURI + `locale/${locale}/global-number.ftl`);
  },
  bindMenuLabelFallback(window) {
    this.applyMenuLabels(window);
    this.toolsPopup = window?.document.getElementById("menu_ToolsPopup");
    this.toolsPopupListener = () => this.applyMenuLabels(window);
    this.toolsPopup?.addEventListener("popupshowing", this.toolsPopupListener);
  },
  applyMenuLabels(window) {
    const chinese = Services.locale.appLocaleAsBCP47?.toLowerCase().startsWith("zh");
    const labels = chinese ? {"global-number-menu":"全局编号","global-number-menu-status":"查看全局编号状态","global-number-menu-assign":"为选中条目分配全局编号","global-number-menu-backfill":"为所有未编号条目补充编号"} : {"global-number-menu":"Global Number","global-number-menu-status":"Show global number status","global-number-menu-assign":"Assign global numbers to selected items","global-number-menu-backfill":"Assign numbers to all unnumbered items"};
    for (const [id, label] of Object.entries(labels)) window?.document.querySelector(`[data-l10n-id="${id}"]`)?.setAttribute("label", label);
  },
  shutdown() { if(this.notifierID) Zotero.Notifier.unregisterObserver(this.notifierID); if(this.menuID) Zotero.MenuManager.unregisterMenu(this.menuID); if(this.columnID) Zotero.ItemTreeManager.unregisterColumn(this.columnID); this.toolsPopup?.removeEventListener("popupshowing",this.toolsPopupListener); },
  notify(event,type,ids) { if(event==="add"&&type==="item") this.chain=this.chain.then(()=>this.assignIDs(ids)).catch(e=>Zotero.logError(e)); },
  read(item) { const m=(item.getField("extra")||"").match(/\[global-number\]\s*([\s\S]*?)\s*\[\/global-number\]/); try{return m?JSON.parse(m[1]):null}catch(_){return null} },
  getNumber(item) { return this.read(item)?.number||null; },
  hasBlock(item) { return /\[global-number\][\s\S]*?\[\/global-number\]/.test(item.getField("extra")||""); },
  write(item,number) { const old=item.getField("extra")||"", block=`[global-number]\n${JSON.stringify({version:1,number})}\n[/global-number]`; item.setField("extra",/\[global-number\][\s\S]*?\[\/global-number\]/.test(old)?old.replace(/\[global-number\][\s\S]*?\[\/global-number\]/,block):`${old}${old?"\n\n":""}${block}`); },
  eligible(item) { return item?.libraryID===Zotero.Libraries.userLibraryID&&item.isRegularItem()&&!this.hasBlock(item); },
  async regularItems() { const values=await Zotero.Items.getAll(Zotero.Libraries.userLibraryID); return values.map(value=>typeof value==="number"?Zotero.Items.get(value):value).filter(item=>item?.isRegularItem()); },
  async status() { const nums=(await this.regularItems()).map(item=>this.getNumber(item)).filter(x=>/^\d{1,5}$/.test(x||"")).map(Number), maximum=nums.length?Math.max(...nums):0; return {maximum,next:maximum+1,assigned:nums.length}; },
  async assign(item) { if(!this.eligible(item))return; const s=await this.status(); if(s.next>99999)throw Error("编号超过 99999"); this.write(item,String(s.next).padStart(5,"0")); await item.saveTx(); },
  async assignIDs(ids) { for(const id of ids)await this.assign(Zotero.Items.get(id)); },
  async assignSelected(items) { for(const item of items)await this.assign(item); await this.showStatus(); },
  async backfillExisting() {
    const items=(await this.regularItems()).filter(item=>this.eligible(item));
    if (!items.length) return this.showStatus();
    const title="补全已有条目编号";
    const ok=Services.prompt.confirm(Zotero.getMainWindow(),title,`将为 ${items.length} 个“我的文库”常规条目补充全局编号。\n\n不会修改标题、标签、分类或附件；已有编号也不会被改写。是否继续？`);
    if (!ok) return;
    let next=(await this.status()).next;
    if(next+items.length-1>99999)throw Error("编号超过 99999");
    for(const item of items) { this.write(item,String(next).padStart(5,"0")); await item.saveTx(); next++; }
    Services.prompt.alert(Zotero.getMainWindow(),title,`已补充 ${items.length} 个编号。\n当前最大：${String(next-1).padStart(5,"0")}`);
  },
  async showStatus() { const s=await this.status(); Services.prompt.alert(Zotero.getMainWindow(),"全局编号",`已编号：${s.assigned}\n当前最大：${String(s.maximum).padStart(5,"0")}\n下一个：${String(s.next).padStart(5,"0")}`); }
};
