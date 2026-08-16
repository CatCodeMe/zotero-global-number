var ReadingQueueNumbers = {
  notifierID: null, menuID: null, columnID: null, toolsPopup: null, toolsPopupListener: null, chain: Promise.resolve(), rootURI: null,
  widthPref: "extensions.zotero.reading-queue-numbers.width", defaultWidth: 5, maxWidth: 12,
  async startup({ id, rootURI }) {
    this.rootURI = rootURI;
    await this.addToWindow(Zotero.getMainWindow());
    this.bindMenuLabelFallback(Zotero.getMainWindow());
    this.notifierID = Zotero.Notifier.registerObserver(this, ["item"], "reading-queue-numbers");
    try {
      this.menuID = Zotero.MenuManager.registerMenu({menuID:"global-number-tools",pluginID:id,target:"main/menubar/tools",menus:[{menuType:"submenu",l10nID:"global-number-menu",menus:[
        {menuType:"menuitem",l10nID:"global-number-menu-status",onCommand:()=>this.showStatus()},
        {menuType:"menuitem",l10nID:"global-number-menu-configure-width",onCommand:()=>this.configureWidth()},
        {menuType:"menuitem",l10nID:"global-number-menu-assign",onCommand:(_e,c)=>this.assignSelected(c.items||[])},
        {menuType:"menuitem",l10nID:"global-number-menu-backfill",onCommand:()=>this.backfillExisting()}]}]});
    } catch (error) { Zotero.logError(error); }
    try {
      // `staticWidth` prevents normal ItemTree context-menu handling in Zotero 9.
      // Keep a compact default while allowing Zotero to persist a user-resized width.
      this.columnID = await Zotero.ItemTreeManager.registerColumn({dataKey:"globalNumber",label:"全局编号",pluginID:id,width:"82px",minWidth:65,zoteroPersist:["width","hidden","sortDirection"],dataProvider:item=>this.getNumber(item)||""});
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
    const labels = chinese ? {"global-number-menu":"全局编号","global-number-menu-status":"查看全局编号状态","global-number-menu-configure-width":"配置编号位数…","global-number-menu-assign":"为选中条目分配全局编号","global-number-menu-backfill":"为所有未编号条目补充编号"} : {"global-number-menu":"Global Number","global-number-menu-status":"Show global number status","global-number-menu-configure-width":"Configure number width…","global-number-menu-assign":"Assign global numbers to selected items","global-number-menu-backfill":"Assign numbers to all unnumbered items"};
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
  numberWidth() { const width=Services.prefs.getIntPref(this.widthPref,this.defaultWidth); return Number.isInteger(width)&&width>=1&&width<=this.maxWidth?width:this.defaultWidth; },
  minimumWidth(maximum) { return String(Math.max(maximum+1,1)).length; },
  format(number) { return String(number).padStart(this.numberWidth(),"0"); },
  async status() { const nums=(await this.regularItems()).map(item=>this.getNumber(item)).filter(x=>/^\d{1,12}$/.test(x||"")).map(Number), maximum=nums.length?Math.max(...nums):0; return {maximum,next:maximum+1,assigned:nums.length,width:this.numberWidth(),minimumWidth:this.minimumWidth(maximum)}; },
  assertCapacity(status) { if(status.width<status.minimumWidth)throw Error(`当前编号位数为 ${status.width}，无法分配 ${status.next}。请先在“工具 → 全局编号 → 配置编号位数”调整为至少 ${status.minimumWidth} 位。`); },
  async assign(item) { if(!this.eligible(item))return; const s=await this.status(); this.assertCapacity(s); this.write(item,this.format(s.next)); await item.saveTx(); },
  async assignIDs(ids) { for(const id of ids)await this.assign(Zotero.Items.get(id)); },
  async assignSelected(items) { for(const item of items)await this.assign(item); await this.showStatus(); },
  async backfillExisting() {
    const items=(await this.regularItems()).filter(item=>this.eligible(item));
    if (!items.length) return this.showStatus();
    const title="补全已有条目编号";
    const ok=Services.prompt.confirm(Zotero.getMainWindow(),title,`将为 ${items.length} 个“我的文库”常规条目补充全局编号。\n\n不会修改标题、标签、分类或附件；已有编号也不会被改写。是否继续？`);
    if (!ok) return;
    let next=(await this.status()).next;
    const end=next+items.length-1;
    if(this.numberWidth()<String(end).length)throw Error(`当前编号位数为 ${this.numberWidth()}，无法补充到 ${end}。请先提高编号位数。`);
    for(const item of items) { this.write(item,this.format(next)); await item.saveTx(); next++; }
    Services.prompt.alert(Zotero.getMainWindow(),title,`已补充 ${items.length} 个编号。\n当前最大：${this.format(next-1)}`);
  },
  async showStatus() { const s=await this.status(); Services.prompt.alert(Zotero.getMainWindow(),"全局编号",`已编号：${s.assigned}\n当前最大：${this.format(s.maximum)}\n下一个：${this.format(s.next)}\n编号位数：${s.width}（最少需要 ${s.minimumWidth} 位）`); },
  async configureWidth() {
    const s=await this.status(), value={value:String(s.width)}, title="配置编号位数";
    const text=`当前最大编号：${this.format(s.maximum)}\n下一个编号：${this.format(s.next)}\n\n请输入编号位数（${s.minimumWidth}–${this.maxWidth}）：`;
    if(!Services.prompt.prompt(Zotero.getMainWindow(),title,text,value,null,{}))return;
    if(!/^\d+$/.test(value.value||""))return Services.prompt.alert(Zotero.getMainWindow(),title,"请输入整数位数。");
    const width=Number(value.value);
    if(width<s.minimumWidth)return Services.prompt.alert(Zotero.getMainWindow(),title,`不能低于 ${s.minimumWidth} 位；当前最大编号后的下一个编号需要至少 ${s.minimumWidth} 位。`);
    if(width>this.maxWidth)return Services.prompt.alert(Zotero.getMainWindow(),title,`最多支持 ${this.maxWidth} 位。`);
    Services.prefs.setIntPref(this.widthPref,width);
    Services.prompt.alert(Zotero.getMainWindow(),title,`编号位数已设置为 ${width} 位。\n后续新编号会显示为：${String(s.next).padStart(width,"0")}`);
  }
};
