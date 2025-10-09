const { db } = require('../firebaseAdmin');

const GOALS = 'savingsGoals';
const CONTRIBUTIONS = 'contributions';
const LOANS = 'loanRequests';

class SavingsGoal {
  constructor(data) {
    Object.assign(this, {
      id: data.id,
      userId: data.userId,
      name: data.name,
      target: data.target,
      saved: data.saved || 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      hustle: data.hustle || null,
      category: data.category || 'Personal',
      isActive: data.isActive !== undefined ? data.isActive : true,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      autoSave: data.autoSave || false,
      autoSaveAmount: data.autoSaveAmount || 0,
      autoSaveFrequency: data.autoSaveFrequency || 'monthly',
      metadata: data.metadata || {},
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });
  }

  static _col() { if (!db) throw new Error('Firestore not initialized'); return db.collection(GOALS); }

  static async findByUser(userId) {
    const snap = await this._col().where('userId','==',userId).orderBy('createdAt','desc').get();
    return snap.docs.map(d=> new SavingsGoal({ id: d.id, ...d.data() }));
  }

  static async findOneById(id) {
    const doc = await this._col().doc(id).get();
    if (!doc.exists) return null;
    return new SavingsGoal({ id: doc.id, ...doc.data() });
  }

  async save() {
    this.updatedAt = new Date();
    const data = { ...this };
    delete data.id;
    if (this.id) {
      await SavingsGoal._col().doc(this.id).set(data, { merge: true });
    } else {
      const ref = await SavingsGoal._col().add(data);
      this.id = ref.id;
    }
    return this;
  }

  async addContribution(amount) {
    this.saved += amount;
    if (this.saved >= this.target && !this.completedAt) this.completedAt = new Date();
    return this.save();
  }

  get progressPercentage() { return this.target > 0 ? Math.round((this.saved/this.target)*100) : 0; }
  get daysRemaining() { if (!this.dueDate) return null; const diff=(this.dueDate - new Date()); return Math.ceil(diff/(1000*60*60*24)); }
}

class Contribution {
  constructor(data) { Object.assign(this, { id: data.id, ...data, createdAt: data.createdAt? new Date(data.createdAt): new Date() }); }
  static _col() { if (!db) throw new Error('Firestore not initialized'); return db.collection(CONTRIBUTIONS); }
  static async findByUser(userId) {
    const snap = await this._col().where('userId','==',userId).orderBy('createdAt','desc').get();
    return snap.docs.map(d=> new Contribution({ id: d.id, ...d.data() }));
  }
  static async findByGoal(goalId) {
    const snap = await this._col().where('goalId','==',goalId).orderBy('createdAt','desc').get();
    return snap.docs.map(d=> new Contribution({ id: d.id, ...d.data() }));
  }
  async save() { const data={...this}; delete data.id; const ref = await Contribution._col().add(data); this.id = ref.id; return this; }
}

class LoanRequest {
  constructor(data) { Object.assign(this, { id: data.id, ...data, createdAt: data.createdAt? new Date(data.createdAt): new Date() }); }
  static _col() { if (!db) throw new Error('Firestore not initialized'); return db.collection(LOANS); }
  static async find(query) {
    let q = this._col();
    if (query.userId) q = q.where('userId','==',query.userId);
    if (query.status) q = q.where('status','==',query.status);
    const snap = await q.orderBy('createdAt','desc').get();
    return snap.docs.map(d=> new LoanRequest({ id: d.id, ...d.data() }));
  }
  static async findOneById(id) {
    const doc = await this._col().doc(id).get();
    if (!doc.exists) return null;
    return new LoanRequest({ id: doc.id, ...doc.data() });
  }
  async save() {
    const data={...this}; delete data.id;
    if (this.interestRate && this.termMonths && this.amount) {
      const mr=this.interestRate/100/12; const n=this.termMonths;
      this.monthlyPayment = mr===0? (this.amount/n): this.amount * (mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1);
    }
    if (this.id) {
      await LoanRequest._col().doc(this.id).set({ ...this }, { merge: true });
    } else {
      const ref = await LoanRequest._col().add({ ...this });
      this.id = ref.id;
    }
    return this;
  }
}

module.exports = { SavingsGoal, LoanRequest, Contribution };
