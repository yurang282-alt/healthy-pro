function toCount(value) {
  const count = Number(value || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getRemainingTotal(remaining) {
  if (!remaining || typeof remaining !== "object") return null;
  return Object.values(remaining).reduce((total, value) => total + toCount(value), 0);
}

async function countUniqueAcrossPages(loaders, pageSize = 100) {
  const ids = new Set();
  for (const loadPage of loaders) {
    let offset = 0;
    while (true) {
      const records = await loadPage(offset, pageSize);
      const page = Array.isArray(records) ? records : [];
      page.forEach((record, index) => {
        const id = record && record._id;
        ids.add(id || `anonymous:${offset + index}:${ids.size}`);
      });
      if (page.length < pageSize) break;
      offset += page.length;
    }
  }
  return ids.size;
}

async function executeDeletion(operations, readRemaining) {
  const deleted = {};
  const errors = [];

  for (const operation of operations) {
    try {
      deleted[operation.key] = toCount(await operation.run());
    } catch (error) {
      deleted[operation.key] = 0;
      errors.push({
        key: operation.key,
        message: error && (error.message || error.errMsg) || "删除失败"
      });
    }
  }

  let remaining = null;
  try {
    remaining = await readRemaining();
  } catch (error) {
    errors.push({
      key: "verification",
      message: error && (error.message || error.errMsg) || "删除结果核对失败"
    });
  }

  const deletedTotal = Object.values(deleted).reduce((total, value) => total + toCount(value), 0);
  const remainingTotal = getRemainingTotal(remaining);
  const complete = errors.length === 0 && remainingTotal === 0;

  return {
    complete,
    partial: !complete && deletedTotal > 0,
    deleted,
    remaining,
    errors
  };
}

module.exports = {
  countUniqueAcrossPages,
  executeDeletion,
  getRemainingTotal
};
