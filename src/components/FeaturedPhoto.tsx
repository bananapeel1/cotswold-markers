import Link from "next/link";

interface FeaturedPhotoData {
  photoUrl: string;
  userName: string;
  markerName: string;
  markerId: string;
  month: string;
  caption: string;
}

export default function FeaturedPhoto({ photo }: { photo: FeaturedPhotoData | null }) {
  if (!photo) return null;

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">emoji_events</span>
          <h2 className="font-headline font-black text-2xl md:text-3xl">
            Photo of the Month
          </h2>
        </div>
        <p className="text-secondary mb-8">{photo.month}</p>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-lg overflow-hidden shadow-ambient">
            <img
              src={photo.photoUrl}
              alt={`Photo by ${photo.userName}`}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute top-3 left-3 bg-primary text-on-primary rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">star</span>
              Featured
            </div>
          </div>
          <div>
            <p className="text-lg leading-relaxed mb-4">
              {photo.caption}
            </p>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <div>
                <p className="font-bold text-sm">{photo.userName}</p>
                <Link
                  href={`/m/${photo.markerId}`}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {photo.markerName}
                </Link>
              </div>
            </div>
            <p className="text-xs text-secondary">
              Share your own photos at any marker for a chance to be featured.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
