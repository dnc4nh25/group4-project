import { useState, useEffect, useRef } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
  Card,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import "./AdminCommon.css";

const API = `${import.meta.env.VITE_API_URL}`;

// Số ghế tối đa trong hệ thống (phòng lớn nhất)
const MAX_SEATS_IN_SYSTEM = 100;

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  minOrderValue: 0,
  minSeats: 0,
  maxDiscount: "",
  usageLimit: "",
  newUsersOnly: false,
  oneTimePerUser: false,
  daysAfterRegistration: "",
  weekendOnly: false,
  validFrom: "",
  validTo: "",
  isActive: true,
};

// ─── Helper: validate toàn bộ form ───────────────────────────────────────────
function validateVoucherForm(form, vouchers, editingId) {
  const errs = {};

  // 1. Mã voucher
  const code = (form.code || "").trim();
  if (!code) {
    errs.code = "Mã voucher không được để trống.";
  } else if (code.includes(" ")) {
    errs.code = "Mã voucher không được chứa khoảng trắng.";
  } else if (
    !/^[A-Z0-9]+$/.test(code.toUpperCase()) ||
    /[^A-Z0-9]/i.test(code)
  ) {
    errs.code = "Mã voucher chỉ được chứa chữ cái in hoa và chữ số.";
  } else if (code.length < 4) {
    errs.code = "Mã voucher phải có ít nhất 4 ký tự.";
  } else if (code.length > 20) {
    errs.code = "Mã voucher không được vượt quá 20 ký tự.";
  } else {
    // Kiểm tra trùng (so sánh case-insensitive, bỏ qua chính mình)
    const duplicate = vouchers.find(
      (v) =>
        v.code.toUpperCase() === code.toUpperCase() &&
        String(v.id) !== String(editingId),
    );
    if (duplicate) errs.code = "Mã voucher này đã tồn tại.";
  }

  // 3. Tiêu đề
  const title = (form.title || "").trim();
  if (!title) {
    errs.title = "Tiêu đề voucher không được để trống.";
  } else if (title.length < 4) {
    errs.title = "Tiêu đề voucher phải có ít nhất 4 ký tự.";
  } else if (title.length > 200) {
    errs.title = "Tiêu đề voucher không được vượt quá 200 ký tự.";
  }

  // 4. Mô tả
  if (form.description && form.description.length > 200) {
    errs.description = "Mô tả không được vượt quá 200 ký tự.";
  }

  // 5. Giá trị giảm
  const value = Number(form.value);
  if (form.value === "" || form.value === null || form.value === undefined) {
    errs.value = "Giá trị giảm không được để trống.";
  } else if (isNaN(value) || value <= 0) {
    errs.value = "Giá trị giảm phải là số dương lớn hơn 0.";
  } else if (form.type === "PERCENTAGE" && value > 100) {
    errs.value = "Giá trị phần trăm giảm không được vượt quá 100%.";
  }

  // 6. Đơn hàng tối thiểu
  if (form.minOrderValue !== "" && form.minOrderValue !== null) {
    const minOrder = Number(form.minOrderValue);
    if (isNaN(minOrder) || minOrder < 0) {
      errs.minOrderValue = "Đơn hàng tối thiểu không được âm.";
    }
  }

  // 7. Số ghế tối thiểu
  if (form.minSeats !== "" && form.minSeats !== null) {
    const minSeats = Number(form.minSeats);
    if (!Number.isInteger(minSeats) || minSeats < 0) {
      errs.minSeats = "Số ghế tối thiểu phải là số nguyên không âm.";
    } else if (minSeats > MAX_SEATS_IN_SYSTEM) {
      errs.minSeats = `Số ghế tối thiểu không được vượt quá ${MAX_SEATS_IN_SYSTEM}.`;
    }
  }

  // 8. Giảm tối đa
  if (
    form.maxDiscount !== "" &&
    form.maxDiscount !== null &&
    form.maxDiscount !== undefined
  ) {
    const maxDiscount = Number(form.maxDiscount);
    if (isNaN(maxDiscount) || maxDiscount < 0) {
      errs.maxDiscount = "Giảm tối đa không được âm.";
    } else if (maxDiscount === 0) {
      errs.maxDiscount = "Giảm tối đa phải lớn hơn 0 nếu có nhập.";
    } else if (
      form.type === "FIXED" &&
      !isNaN(value) &&
      value > 0 &&
      maxDiscount < value
    ) {
      errs.maxDiscount = "Giảm tối đa không được nhỏ hơn giá trị giảm cố định.";
    }
  }

  // 9. Giới hạn sử dụng
  const usageLimit = Number(form.usageLimit);
  if (form.usageLimit === "" || form.usageLimit === null) {
    errs.usageLimit = "Giới hạn sử dụng không được để trống.";
  } else if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
    errs.usageLimit = "Giới hạn sử dụng phải là số nguyên dương lớn hơn 0.";
  }

  // 10 & 11. Ngày bắt đầu / kết thúc
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!form.validFrom) {
    errs.validFrom = "Ngày bắt đầu không được để trống.";
  } else {
    const from = new Date(form.validFrom);
    if (from < today) {
      errs.validFrom = "Ngày bắt đầu không được là ngày trong quá khứ.";
    }
  }

  if (!form.validTo) {
    errs.validTo = "Ngày kết thúc không được để trống.";
  }

  if (form.validFrom && form.validTo && !errs.validFrom) {
    const from = new Date(form.validFrom);
    const to   = new Date(form.validTo);
    if (to <= from) {
      errs.validTo = "Ngày kết thúc phải sau ngày bắt đầu.";
    }
  }

  // 16. Số ngày sau đăng ký (chỉ validate khi bật newUsersOnly)
  if (
    form.newUsersOnly &&
    form.daysAfterRegistration !== "" &&
    form.daysAfterRegistration !== null
  ) {
    const days = Number(form.daysAfterRegistration);
    if (!Number.isInteger(days) || days <= 0) {
      errs.daysAfterRegistration =
        "Số ngày sau khi đăng ký phải là số nguyên dương lớn hơn 0.";
    }
  }

  return errs;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  const modalBodyRef = useRef(null);
  const errorBannerRef = useRef(null);

  const scrollToFormError = () => {
    setTimeout(() => {
      const container = modalBodyRef.current;
      if (!container) return;

      const firstErrorField = container.querySelector(".field-invalid");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof firstErrorField.focus === "function") {
          firstErrorField.focus({ preventScroll: true });
        }
        return;
      }

      if (errorBannerRef.current) {
        errorBannerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/vouchers`);
      setVouchers(res.data);
    } catch {
      setError("Lỗi tải dữ liệu voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setModalError("");
    setFieldErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (voucher) => {
    setForm({
      code: voucher.code || "",
      title: voucher.title || "",
      description: voucher.description || "",
      type: voucher.type || "PERCENTAGE",
      value: voucher.value || "",
      minOrderValue: voucher.minOrderValue ?? 0,
      minSeats: voucher.minSeats ?? 0,
      maxDiscount: voucher.maxDiscount != null ? voucher.maxDiscount : "",
      usageLimit: voucher.usageLimit || "",
      newUsersOnly: voucher.newUsersOnly || false,
      oneTimePerUser: voucher.oneTimePerUser || false,
      daysAfterRegistration:
        voucher.daysAfterRegistration != null
          ? voucher.daysAfterRegistration
          : "",
      weekendOnly: voucher.weekendOnly || false,
      validFrom: voucher.validFrom ? voucher.validFrom.split("T")[0] : "",
      validTo: voucher.validTo ? voucher.validTo.split("T")[0] : "",
      isActive: voucher.isActive !== undefined ? voucher.isActive : true,
    });
    setEditingId(voucher.id);
    setError("");
    setModalError("");
    setFieldErrors({});
    setShowModal(true);
  };

  // Xóa lỗi field khi user bắt đầu chỉnh sửa
  const clearFieldError = (name) => {
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearFieldError(name);

    // Khi thay đổi type, xóa luôn lỗi value và maxDiscount vì ngưỡng đổi
    if (name === "type") {
      setFieldErrors((prev) => ({ ...prev, value: "", maxDiscount: "" }));
    }
    // Khi tắt newUsersOnly, xóa lỗi daysAfterRegistration
    if (name === "newUsersOnly" && !checked) {
      setFieldErrors((prev) => ({ ...prev, daysAfterRegistration: "" }));
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setModalError("");

    // ── Validate frontend trước ──
    const errs = validateVoucherForm(form, vouchers, editingId);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      scrollToFormError();
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description?.trim() || "",
        type: form.type,
        value: parseFloat(form.value),
        minOrderValue:
          form.minOrderValue !== "" && form.minOrderValue !== null
            ? parseInt(form.minOrderValue)
            : 0,
        minSeats:
          form.minSeats !== "" && form.minSeats !== null
            ? parseInt(form.minSeats)
            : 0,
        maxDiscount:
          form.maxDiscount !== "" &&
          form.maxDiscount !== null &&
          form.maxDiscount !== undefined
            ? parseInt(form.maxDiscount)
            : null,
        usageLimit: parseInt(form.usageLimit),
        usedCount: editingId
          ? vouchers.find((v) => v.id === editingId)?.usedCount || 0
          : 0,
        newUsersOnly: form.newUsersOnly || false,
        oneTimePerUser: form.oneTimePerUser || false,
        daysAfterRegistration:
          form.newUsersOnly &&
          form.daysAfterRegistration !== "" &&
          form.daysAfterRegistration !== null
            ? parseInt(form.daysAfterRegistration)
            : null,
        weekendOnly: form.weekendOnly || false,
        validFrom: form.validFrom,
        validTo: form.validTo,
        isActive: form.isActive !== undefined ? form.isActive : true,
      };

      if (editingId) {
        await axios.put(`${API}/vouchers/${editingId}`, payload);
      } else {
        await axios.post(`${API}/vouchers`, payload);
      }

      setShowModal(false);
      load();
    } catch (err) {
      console.error("Save error:", err);
      // Xử lý lỗi validation từ backend (HTTP 422)
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setModalError("❌ Lưu thất bại. Vui lòng thử lại.");
      }
      scrollToFormError();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API}/vouchers/${deletingId}`);
      setShowDeleteConfirm(false);
      load();
    } catch {
      setError("Xóa thất bại.");
    }
  };

  const handleToggleStatus = async (voucher) => {
    try {
      await axios.patch(`${API}/vouchers/${voucher.id}`, {
        isActive: !voucher.isActive,
      });
      load();
    } catch {
      setError("Cập nhật trạng thái thất bại.");
    }
  };

  // Helper hiển thị lỗi field inline
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <div
        className="field-error-msg"
        style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "4px" }}
      >
        ⚠ {fieldErrors[name]}
      </div>
    ) : null;

  const filtered = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.title.toLowerCase().includes(search.toLowerCase()),
  );

  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter((v) => v.isActive).length;
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
  const totalLimit = vouchers.reduce((sum, v) => sum + (v.usageLimit || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="page-header-banner py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-1">🎫 Quản lý Voucher</h1>
              <p className="text-muted mb-0">
                Quản lý mã giảm giá và ưu đãi cho khách hàng
              </p>
            </div>
            <Button className="btn-primary-custom" onClick={handleOpenAdd}>
              ➕ Thêm voucher mới
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        <Row className="admin-stats-row g-3 mb-4">
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">🎫</div>
              <div className="stat-card-value">{totalVouchers}</div>
              <div className="stat-card-label">Tổng voucher</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon success">✅</div>
              <div className="stat-card-value">{activeVouchers}</div>
              <div className="stat-card-label">Đang hoạt động</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon secondary">📊</div>
              <div className="stat-card-value">{totalUsed}</div>
              <div className="stat-card-label">Lượt sử dụng</div>
            </div>
          </Col>
          <Col xs={6} lg={3}>
            <div className="admin-stat-card-custom">
              <div className="stat-card-icon primary">🎯</div>
              <div className="stat-card-value">{totalLimit}</div>
              <div className="stat-card-label">Tổng giới hạn</div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <Card className="filter-card mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small text-muted">Tìm kiếm</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="search-addon">
                      🔍
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      className="filter-input"
                      placeholder="Tìm kiếm theo mã hoặc tiêu đề..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {loading ? (
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-title">Không tìm thấy voucher nào</div>
            <div className="empty-state-text">
              {search
                ? "Thử thay đổi từ khóa tìm kiếm"
                : "Bắt đầu bằng cách thêm voucher mới"}
            </div>
            {!search && (
              <Button className="btn-primary-custom" onClick={handleOpenAdd}>
                ➕ Thêm voucher đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <Card className="table-card">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table modern-table" hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã voucher</th>
                      <th>Mô tả</th>
                      <th>Loại</th>
                      <th>Giá trị</th>
                      <th>Sử dụng</th>
                      <th>Hiệu lực</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((voucher, index) => (
                      <tr key={voucher.id} className="table-row-hover">
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <div className="voucher-code-cell">
                            <strong>{voucher.code}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="voucher-title-cell">
                            <small className="text-muted d-block">
                              {voucher.description}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg={
                              voucher.type === "PERCENTAGE" ? "info" : "warning"
                            }
                            className="time-badge"
                          >
                            {voucher.type === "PERCENTAGE"
                              ? "Phần trăm"
                              : "Cố định"}
                          </Badge>
                        </td>
                        <td>
                          <span className="price-cell">
                            {voucher.type === "PERCENTAGE"
                              ? `${voucher.value}%`
                              : `${voucher.value.toLocaleString()}đ`}
                          </span>
                        </td>
                        <td>
                          <div className="usage-cell">
                            <span
                              className={
                                voucher.usedCount >= voucher.usageLimit
                                  ? "text-danger"
                                  : "text-success"
                              }
                            >
                              {voucher.usedCount || 0}/{voucher.usageLimit}
                            </span>
                            <div className="usage-bar">
                              <div
                                className="usage-fill"
                                style={{
                                  width: `${Math.min(
                                    ((voucher.usedCount || 0) /
                                      voucher.usageLimit) *
                                      100,
                                    100,
                                  )}%`,
                                  backgroundColor:
                                    voucher.usedCount >= voucher.usageLimit
                                      ? "#dc3545"
                                      : "#28a745",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="validity-cell">
                            <small className="text-muted">
                              {new Date(voucher.validFrom).toLocaleDateString()}{" "}
                              - {new Date(voucher.validTo).toLocaleDateString()}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg={voucher.isActive ? "success" : "secondary"}
                            className="time-badge"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleToggleStatus(voucher)}
                          >
                            {voucher.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="action-btn me-1"
                              onClick={() => handleOpenEdit(voucher)}
                              title="Sửa"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="action-btn"
                              onClick={() => handleDeleteClick(voucher.id)}
                              title="Xóa"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* ─── Modal Thêm / Sửa ──────────────────────────────────────────────── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        scrollable
        className="admin-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "✏️ Sửa voucher" : "➕ Thêm voucher mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave} noValidate>
          <Modal.Body ref={modalBodyRef}>
            {modalError && (
              <div ref={errorBannerRef} className="mb-3">
                <Alert
                  variant="danger"
                  onClose={() => setModalError("")}
                  dismissible
                >
                  {modalError}
                </Alert>
              </div>
            )}

            <Row className="g-3">
              {/* ── Mã voucher ── */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Mã voucher <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập mã voucher"
                    style={{ textTransform: "uppercase" }}
                    className={fieldErrors.code ? "field-invalid" : ""}
                    disabled={!!editingId} // Không cho đổi code khi edit
                  />
                  <Form.Text className="text-muted">
                    Chỉ chữ in hoa và số, 4–20 ký tự
                  </Form.Text>
                  <FieldError name="code" />
                </Form.Group>
              </Col>

              {/* ── Loại giảm giá ── */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Loại giảm giá <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={fieldErrors.type ? "field-invalid" : ""}
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đ)</option>
                  </Form.Select>
                  <FieldError name="type" />
                </Form.Group>
              </Col>

              {/* ── Tiêu đề ── */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>
                    Tiêu đề <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập tiêu đề."
                    className={fieldErrors.title ? "field-invalid" : ""}
                  />
                  <FieldError name="title" />
                </Form.Group>
              </Col>

              {/* ── Mô tả ── */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập mô tả chi tiết về voucher."
                    className={fieldErrors.description ? "field-invalid" : ""}
                    maxLength={500}
                  />
                  <div className="d-flex justify-content-between align-items-start mt-1">
                    <FieldError name="description" />
                    <small className="text-muted ms-auto">
                      {(form.description || "").length}/500
                    </small>
                  </div>
                </Form.Group>
              </Col>

              {/* ── Giá trị giảm ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Giá trị giảm <span className="text-danger">*</span>{" "}
                    {form.type === "PERCENTAGE" ? "(%)" : "(đ)"}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    min="0.01"
                    max={form.type === "PERCENTAGE" ? "100" : undefined}
                    step={form.type === "PERCENTAGE" ? "0.1" : "1000"}
                    placeholder={
                      form.type === "PERCENTAGE" ? "VD: 20" : "VD: 50000"
                    }
                    className={fieldErrors.value ? "field-invalid" : ""}
                  />
                  {form.type === "PERCENTAGE" && (
                    <Form.Text className="text-muted">
                      Nhập từ 1 đến 100
                    </Form.Text>
                  )}
                  <FieldError name="value" />
                </Form.Group>
              </Col>

              {/* ── Đơn hàng tối thiểu ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Đơn hàng tối thiểu (đ)</Form.Label>
                  <Form.Control
                    type="number"
                    name="minOrderValue"
                    value={form.minOrderValue}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="0"
                    className={fieldErrors.minOrderValue ? "field-invalid" : ""}
                  />
                  <FieldError name="minOrderValue" />
                </Form.Group>
              </Col>

              {/* ── Số ghế tối thiểu ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Số ghế tối thiểu</Form.Label>
                  <Form.Control
                    type="number"
                    name="minSeats"
                    value={form.minSeats}
                    onChange={handleChange}
                    min="0"
                    max={MAX_SEATS_IN_SYSTEM}
                    placeholder="0"
                    className={fieldErrors.minSeats ? "field-invalid" : ""}
                  />
                  <Form.Text className="text-muted">
                    Tối đa {MAX_SEATS_IN_SYSTEM} ghế
                  </Form.Text>
                  <FieldError name="minSeats" />
                </Form.Group>
              </Col>

              {/* ── Giảm tối đa ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Giảm tối đa (đ)
                    {form.type === "PERCENTAGE" && (
                      <span
                        className="text-muted ms-1"
                        style={{ fontSize: "0.78rem" }}
                      ></span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="maxDiscount"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    min="1"
                    step="1000"
                    placeholder="Không giới hạn"
                    className={fieldErrors.maxDiscount ? "field-invalid" : ""}
                  />
                  <FieldError name="maxDiscount" />
                </Form.Group>
              </Col>

              {/* ── Giới hạn sử dụng ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Giới hạn sử dụng <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="VD: 100"
                    className={fieldErrors.usageLimit ? "field-invalid" : ""}
                  />
                  <Form.Text className="text-muted">
                    Số lượt tối đa có thể dùng
                  </Form.Text>
                  <FieldError name="usageLimit" />
                </Form.Group>
              </Col>

              {/* ── Trạng thái ── */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label={form.isActive ? "Kích hoạt" : "Tạm dừng"}
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              {/* ── Ngày bắt đầu / kết thúc ── */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Ngày bắt đầu <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="validFrom"
                    value={form.validFrom}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.validFrom ? "field-invalid" : ""}
                  />
                  <FieldError name="validFrom" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Ngày kết thúc <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="validTo"
                    value={form.validTo}
                    onChange={handleChange}
                    min={(() => {
                      if (!form.validFrom) return new Date().toISOString().split('T')[0];
                      const d = new Date(form.validFrom);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().split('T')[0];
                    })()}
                    className={fieldErrors.validTo ? "field-invalid" : ""}
                  />
                  <FieldError name="validTo" />
                </Form.Group>
              </Col>

              {/* ── Cài đặt nâng cao ── */}
              <Col xs={12}>
                <hr className="my-2" />
                <h6 className="text-muted mb-3">⚙️ Cài đặt nâng cao</h6>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    name="newUsersOnly"
                    label="Chỉ dành cho thành viên mới"
                    checked={form.newUsersOnly}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted d-block">
                    Chỉ áp dụng cho user chưa từng đặt vé
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    name="oneTimePerUser"
                    label="Mỗi người dùng chỉ dùng 1 lần"
                    checked={form.oneTimePerUser}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted d-block">
                    Kiểm tra lịch sử khi thanh toán
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    name="weekendOnly"
                    label="Chỉ áp dụng cuối tuần"
                    checked={form.weekendOnly}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted d-block">
                    Chỉ áp dụng vào thứ 7 hoặc chủ nhật
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* ── Số ngày sau đăng ký ── */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Số ngày sau khi đăng ký
                    {form.newUsersOnly && (
                      <span className="text-danger"> *</span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="daysAfterRegistration"
                    value={form.daysAfterRegistration}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder={form.newUsersOnly ? "VD: 7" : "Không giới hạn"}
                    disabled={!form.newUsersOnly}
                    className={
                      fieldErrors.daysAfterRegistration ? "field-invalid" : ""
                    }
                  />
                  <Form.Text className="text-muted">
                    {form.newUsersOnly
                      ? "Voucher hợp lệ trong N ngày kể từ khi đăng ký"
                      : 'Bật "Thành viên mới" để cấu hình'}
                  </Form.Text>
                  <FieldError name="daysAfterRegistration" />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="btn-primary-custom"
              disabled={saving}
            >
              {saving ? (
                <Spinner size="sm" />
              ) : editingId ? (
                "Cập nhật"
              ) : (
                "Thêm mới"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ─── Modal Xác nhận xóa ──────────────────────────────────────────────── */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa voucher này không?</p>
          <p className="text-muted small">Hành động này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
