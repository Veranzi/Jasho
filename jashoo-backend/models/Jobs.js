const { db } = require('../firebaseAdmin');

const JOBS = 'jobs';
const APPLICATIONS = 'jobApplications';

function defaultJob(data) {
  const now = new Date();
  return {
    jobId: data.jobId || `JOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    description: data.description,
    location: data.location || { address: '', city: '' },
    category: data.category,
    urgency: data.urgency || 'medium',
    priceKes: data.priceKes || 0,
    estimatedDuration: data.estimatedDuration || null,
    postedBy: data.postedBy,
    assignedTo: data.assignedTo || null,
    status: data.status || 'active',
    requirements: data.requirements || [],
    skills: data.skills || [],
    images: data.images || [],
    applicationCount: data.applicationCount || 0,
    maxApplications: data.maxApplications || 10,
    featured: data.featured || false,
    expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    statistics: data.statistics || { views: 0, applications: 0, shares: 0, saves: 0 },
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

class Job {
  constructor(data) {
    Object.assign(this, defaultJob(data || {}));
  }

  static _col() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(JOBS);
  }

  static async findOne(query) {
    if (query.jobId) {
      const snap = await this._col().where('jobId', '==', query.jobId).limit(1).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return new Job({ id: doc.id, ...doc.data() });
    }
    return null;
  }

  static async findActiveJobs(options = {}) {
    const { limit = 20, skip = 0, category, location, minPrice, maxPrice, urgency } = options;
    let q = this._col().where('status', 'in', ['active', 'pending']);
    if (category) q = q.where('category', '==', category);
    if (urgency) q = q.where('urgency', '==', urgency);
    const snap = await q.orderBy('createdAt', 'desc').limit(limit + skip).get();
    let jobs = snap.docs.map((d) => new Job({ id: d.id, ...d.data() }));
    if (location) jobs = jobs.filter((j) => (j.location?.city || '').toLowerCase().includes(String(location).toLowerCase()));
    if (minPrice) jobs = jobs.filter((j) => j.priceKes >= minPrice);
    if (maxPrice) jobs = jobs.filter((j) => j.priceKes <= maxPrice);
    return jobs.slice(skip, skip + limit);
  }

  static async searchJobs(searchQuery, options = {}) {
    const all = await this.findActiveJobs({ ...options, skip: 0, limit: 200 });
    const q = String(searchQuery).toLowerCase();
    return all.filter(
      (j) =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        (j.skills || []).some((s) => String(s).toLowerCase().includes(q))
    );
  }

  static async findByUser(userId, type = 'posted', options = {}) {
    const { limit = 20, skip = 0, status } = options;
    let q = this._col();
    if (type === 'posted') q = q.where('postedBy', '==', userId);
    if (type === 'assigned') q = q.where('assignedTo', '==', userId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.orderBy('createdAt', 'desc').limit(limit + skip).get();
    const jobs = snap.docs.map((d) => new Job({ id: d.id, ...d.data() }));
    return jobs.slice(skip, skip + limit);
  }

  async save() {
    this.updatedAt = new Date();
    if (this.id) {
      await Job._col().doc(this.id).set({ ...this }, { merge: true });
      return this;
    }
    const ref = await Job._col().add({ ...this });
    this.id = ref.id;
    return this;
  }

  async incrementViews() {
    this.statistics = this.statistics || { views: 0, applications: 0, shares: 0, saves: 0 };
    this.statistics.views = (this.statistics.views || 0) + 1;
    return this.save();
  }

  async addApplication() {
    this.applicationCount = (this.applicationCount || 0) + 1;
    return this.save();
  }

  async assignTo(userId) {
    this.assignedTo = userId;
    this.status = 'in_progress';
    return this.save();
  }

  async complete(rating, review) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (rating !== undefined) this.rating = rating;
    if (review) this.review = review;
    return this.save();
  }

  async cancel(reason) {
    this.status = 'cancelled';
    this.completionNotes = reason || this.completionNotes;
    return this.save();
  }
}

class JobApplication {
  constructor(data) {
    Object.assign(this, {
      applicationId: data.applicationId || `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: data.createdAt || new Date(),
    });
  }

  static _col() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(APPLICATIONS);
  }

  static async findOne(query) {
    let q = this._col();
    for (const [field, value] of Object.entries(query)) {
      q = q.where(field, '==', value);
    }
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return new JobApplication({ id: doc.id, ...doc.data() });
  }

  static async findByJob(jobId, options = {}) {
    const { limit = 20, skip = 0, status } = options;
    let q = this._col().where('jobId', '==', jobId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.orderBy('createdAt', 'desc').limit(limit + skip).get();
    const apps = snap.docs.map((d) => new JobApplication({ id: d.id, ...d.data() }));
    return apps.slice(skip, skip + limit);
  }

  static async findByApplicant(applicantId, options = {}) {
    const { limit = 20, skip = 0, status } = options;
    let q = this._col().where('applicantId', '==', applicantId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.orderBy('createdAt', 'desc').limit(limit + skip).get();
    const apps = snap.docs.map((d) => new JobApplication({ id: d.id, ...d.data() }));
    return apps.slice(skip, skip + limit);
  }

  async save() {
    if (this.id) {
      await JobApplication._col().doc(this.id).set({ ...this }, { merge: true });
      return this;
    }
    const ref = await JobApplication._col().add({ ...this });
    this.id = ref.id;
    return this;
  }

  async accept(reviewedBy, reviewNotes) {
    this.status = 'accepted';
    this.reviewedBy = reviewedBy;
    this.reviewNotes = reviewNotes;
    this.reviewedAt = new Date();
    this.respondedAt = new Date();
    return this.save();
  }

  async reject(reviewedBy, rejectionReason) {
    this.status = 'rejected';
    this.reviewedBy = reviewedBy;
    this.rejectionReason = rejectionReason;
    this.reviewedAt = new Date();
    this.respondedAt = new Date();
    return this.save();
  }

  async withdraw() {
    this.status = 'withdrawn';
    this.respondedAt = new Date();
    return this.save();
  }
}

module.exports = { Job, JobApplication };
