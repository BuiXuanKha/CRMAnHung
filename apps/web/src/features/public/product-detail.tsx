'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getProductBySlug } from './mock-data';
import './public-home.css';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug);
  const [copied, setCopied] = useState(false);

  if (!product) {
    return (
      <div className="ph">
        <div className="ph-detail">
          <Link href="/" className="ph-detail-back">
            ← Về trang chủ
          </Link>
          <h1>Không tìm thấy sản phẩm</h1>
        </div>
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: `${product.title} — ${product.priceLabel}`,
          url,
        });
        return;
      }
    } catch {
      // clipboard
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="ph">
      <div className="ph-detail">
        <Link href="/#san-pham" className="ph-detail-back">
          ← Sản phẩm
        </Link>
        <div className="ph-detail-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.title} />
        </div>
        <h1>{product.title}</h1>
        <p className="ph-detail-meta">
          {product.priceLabel} · {product.areaLabel}
        </p>
        <p className="ph-detail-loc">{product.location}</p>
        <div className="ph-detail-actions">
          <button type="button" className="ph-btn ph-btn-primary" onClick={() => void share()}>
            {copied ? 'Đã copy link' : 'Chia sẻ lên MXH'}
          </button>
          <Link href="/login" className="ph-btn ph-btn-ghost">
            Nhân viên đăng nhập CRM
          </Link>
        </div>
      </div>
    </div>
  );
}
