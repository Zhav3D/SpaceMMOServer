// 3D Vector implementation
export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  static one(): Vector3 {
    return new Vector3(1, 1, 1);
  }

  static up(): Vector3 {
    return new Vector3(0, 1, 0);
  }

  static forward(): Vector3 {
    return new Vector3(0, 0, 1);
  }

  static right(): Vector3 {
    return new Vector3(1, 0, 0);
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vector3 {
    if (scalar === 0) {
      throw new Error('Division by zero');
    }
    return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  sqrMagnitude(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3 {
    const mag = this.magnitude();
    if (mag === 0) {
      return Vector3.zero();
    }
    return this.divide(mag);
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  distance(v: Vector3): number {
    return this.subtract(v).magnitude();
  }

  sqrDistance(v: Vector3): number {
    return this.subtract(v).sqrMagnitude();
  }

  lerp(v: Vector3, t: number): Vector3 {
    t = Math.max(0, Math.min(1, t));
    return new Vector3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }

  toString(): string {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  fromArray(array: [number, number, number]): Vector3 {
    this.x = array[0];
    this.y = array[1];
    this.z = array[2];
    return this;
  }
}

// Quaternion implementation for rotations
export class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1
  ) {}

  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  static fromEuler(x: number, y: number, z: number): Quaternion {
    // Convert Euler angles (in radians) to Quaternion
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    return new Quaternion(
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz,
      cx * cy * cz + sx * sy * sz
    );
  }

  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);
    const normalized = axis.normalize();
    return new Quaternion(
      normalized.x * s,
      normalized.y * s,
      normalized.z * s,
      Math.cos(halfAngle)
    );
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  normalize(): Quaternion {
    const mag = this.magnitude();
    if (mag === 0) {
      return Quaternion.identity();
    }
    return new Quaternion(
      this.x / mag,
      this.y / mag,
      this.z / mag,
      this.w / mag
    );
  }

  multiply(q: Quaternion): Quaternion {
    return new Quaternion(
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
    );
  }

  toEuler(): Vector3 {
    // Convert to Euler angles (in radians)
    // Note: this is one of many possible implementations, and gimbal lock can occur
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    const x = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (this.w * this.y - this.z * this.x);
    let y;
    if (Math.abs(sinp) >= 1) {
      y = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
    } else {
      y = Math.asin(sinp);
    }

    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    const z = Math.atan2(siny_cosp, cosy_cosp);

    return new Vector3(x, y, z);
  }

  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  inverse(): Quaternion {
    const mag = this.magnitude();
    if (mag === 0) {
      throw new Error('Cannot invert zero-length quaternion');
    }
    const magSq = mag * mag;
    return new Quaternion(
      -this.x / magSq,
      -this.y / magSq,
      -this.z / magSq,
      this.w / magSq
    );
  }

  rotateVector(v: Vector3): Vector3 {
    // Convert vector to quaternion (with w=0)
    const vq = new Quaternion(v.x, v.y, v.z, 0);
    
    // q * v * q^-1
    const q1 = this.clone();
    const q2 = this.conjugate();
    const result = q1.multiply(vq).multiply(q2);
    
    return new Vector3(result.x, result.y, result.z);
  }

  slerp(q: Quaternion, t: number): Quaternion {
    // Spherical linear interpolation between quaternions
    t = Math.max(0, Math.min(1, t));
    
    let cosHalfTheta = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    
    if (cosHalfTheta < 0) {
      // Ensure we take the shortest path
      q = new Quaternion(-q.x, -q.y, -q.z, -q.w);
      cosHalfTheta = -cosHalfTheta;
    }
    
    if (cosHalfTheta > 0.99) {
      // Quaternions are very close - use linear interpolation
      return new Quaternion(
        this.x + (q.x - this.x) * t,
        this.y + (q.y - this.y) * t,
        this.z + (q.z - this.z) * t,
        this.w + (q.w - this.w) * t
      ).normalize();
    }
    
    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);
    
    if (Math.abs(sinHalfTheta) < 0.001) {
      // Very close - use linear interpolation
      return new Quaternion(
        this.x * 0.5 + q.x * 0.5,
        this.y * 0.5 + q.y * 0.5,
        this.z * 0.5 + q.z * 0.5,
        this.w * 0.5 + q.w * 0.5
      ).normalize();
    }
    
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
    
    return new Quaternion(
      this.x * ratioA + q.x * ratioB,
      this.y * ratioA + q.y * ratioB,
      this.z * ratioA + q.z * ratioB,
      this.w * ratioA + q.w * ratioB
    );
  }

  toString(): string {
    return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  fromArray(array: [number, number, number, number]): Quaternion {
    this.x = array[0];
    this.y = array[1];
    this.z = array[2];
    this.w = array[3];
    return this;
  }
}
