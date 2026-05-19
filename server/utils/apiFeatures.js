export class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ['page', 'sort', 'limit', 'fields', 'search', 'keyword'];
    excluded.forEach((key) => delete queryObj[key]);

    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === 'true') queryObj[key] = true;
      if (queryObj[key] === 'false') queryObj[key] = false;
    });

    this.query = this.query.find(queryObj);
    return this;
  }

  search(searchFields = []) {
    const keyword = this.queryString.search || this.queryString.keyword;
    if (keyword && searchFields.length) {
      const regex = new RegExp(keyword, 'i');
      this.query = this.query.find({
        $or: searchFields.map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}
