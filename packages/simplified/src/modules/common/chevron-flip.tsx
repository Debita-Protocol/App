import React from 'react';
import classNames from 'classnames';

// @ts-ignore
import Styles from './chevron-flip.styles.less';

import { Icons } from '@augurproject/comps';
import { BlackChevronDown, SizedChevronFlipIcon, WhiteChevronDown } from '@augurproject/comps/build/components/common/icons';
import { useSimplifiedStore } from 'modules/stores/simplified';

const { ChevronFlipIcon } = Icons;
 
interface ChevronFlipProps {
  pointDown?: boolean;
  large?: boolean;
}

const ChevronFlip = ({ pointDown, large }: ChevronFlipProps) => (
  <span
    className={classNames(Styles.ChevronFlip, {
      [Styles.pointDown]: pointDown
    })}
  >
    {ChevronFlipIcon}
  </span>
);


export const SizedChevronFlip = ({pointDown, width, height}) => {
  const {
    settings: { theme },
  } = useSimplifiedStore();
  return (
    <span
    className={classNames(Styles.LargeChevronFlip, {
      [Styles.pointDown]: pointDown
    })}
  >
    <img src={theme === "Dark" ? WhiteChevronDown : BlackChevronDown} style={{ height , width }} />
  </span>
  )
}

export default ChevronFlip;
