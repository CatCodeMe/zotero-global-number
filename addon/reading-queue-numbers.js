var ReadingQueueNumbers = {
  notifierID: null, menuID: null, columnID: null, chain: Promise.resolve(),
  async startup({ id }) {
    this.notifierID = Zotero.Notifier.registerObserver(this, ["item"], "reading-queue-numbers");
    this.menuID = Zotero.MenuManager.registerMenu({menuID:"global-number-tools",pluginID:id,target:"main/menubar/tools",menus:[{menuType:"submenu",l10nID:"global-number-menu",menus:[
      {menuType:"menuitem",l10nID:"global-number-menu-status",onCommand:()=>this.showStatus()},
      {menuType:"menuitem",l10nID:"global-number-menu-assign",onCommand:(_e,c)=>this.assignSelected(c.items||[])}]}]});
    this.columnID = await Zotero.ItemTreeManager.registerColumn({dataKey:"globalNumber",label:"全局编号",pluginID:id,dataProvider:item=>this.getNumber(item)||""});
  },
  shutdown() { if(this.notifierID) Zotero.Notifier.unregisterObserver(this.notifierID); if(this.menuID) Zotero.MenuManager.unregisterMenu(this.menuID); if(this.columnID) Zotero.ItemTreeManager.unregisterColumn(this.columnID); },
  notify(event,type,ids) { if(event==="add"&&type==="item") this.chain=this.chain.then(()=>this.assignIDs(ids)).catch(e=>Zotero.logError(e)); },
  read(item) { const m=(item.getField("extra")||"").match(/\[global-number\]\s*([\s\S]*?)\s*\[\/global-number\]/); try{return m?JSON.parse(m[1]):null}catch(_){return null} },
  getNumber(item) { return this.read(item)?.number||null; },
  write(item,number) { const old=item.getField("extra")||"", block=`[global-number]\n${JSON.stringify({version:1,number})}\n[/global-number]`; item.setField("extra",/\[global-number\][\s\S]*?\[\/global-number\]/.test(old)?old.replace(/\[global-number\][\s\S]*?\[\/global-number\]/,block):`${old}${old?"\n\n":""}${block}`); },
  eligible(item) { return item?.libraryID===Zotero.Libraries.userLibraryID&&item.isRegularItem()&&!this.getNumber(item); },
  async status() { const items=await Zotero.Items.getAll(Zotero.Libraries.userLibraryID); const nums=items.map(id=>Zotero.Items.get(id)).filter(x=>x?.isRegularItem()).map(x=>this.getNumber(x)).filter(x=>/^\d{1,5}$/.test(x||"")).map(Number), maximum=nums.length?Math.max(...nums):0; return {maximum,next:maximum+1,assigned:nums.length}; },
  async assign(item) { if(!this.eligible(item))return; const s=await this.status(); if(s.next>99999)throw Error("编号超过 99999"); this.write(item,String(s.next).padStart(5,"0")); await item.saveTx(); },
  async assignIDs(ids) { for(const id of ids)await this.assign(Zotero.Items.get(id)); },
  async assignSelected(items) { for(const item of items)await this.assign(item); await this.showStatus(); },
  async showStatus() { const s=await this.status(); Services.prompt.alert(Zotero.getMainWindow(),"全局编号",`已编号：${s.assigned}\n当前最大：${String(s.maximum).padStart(5,"0")}\n下一个：${String(s.next).padStart(5,"0")}`); }
};
