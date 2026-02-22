import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instagram-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instagram-feed.html',
  styleUrls: ['./instagram-feed.scss'],
})
export class InstagramFeed {
  // Acá podrías poner el usuario si querés mostrarlo en el título
  readonly username = 'guillerme.guillerme.589';
}